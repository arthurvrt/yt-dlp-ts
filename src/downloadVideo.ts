import { execa } from "execa";
import prompts from "prompts";
import { promptUserForFilePath, promptUserForMediaType } from "./cli-utils";
import {
  getFormats,
  getFormatTitle,
  getFormatValue,
  getYtDlpFormatString,
} from "./format";
import { Format, MediaType, Video } from "./types";

export const getVideoInfo = async (videoUrl: string): Promise<Video> => {
  try {
    const result = await execa(
      "yt-dlp",
      ["--dump-json", "--format-sort=resolution,ext,tbr", videoUrl].filter(
        (x) => Boolean(x)
      )
    );

    const parsedResult = JSON.parse(result.stdout);
    return parsedResult as Video;
  } catch (error) {
    console.error(`Failed to get video info for URL ${videoUrl}:`, error);
    throw error;
  }
};

export const getVideoFromId = async (videoId: string): Promise<Video> => {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return getVideoInfo(videoUrl);
};

export const getVideosFromIds = async (
  videoIds: string[]
): Promise<Video[]> => {
  const videos: Video[] = [];

  for (const videoId of videoIds) {
    try {
      const video = await getVideoFromId(videoId);
      videos.push(video);
    } catch (err) {
      throw new Error(`Failed to get video for ID ${videoId}: ${err.message}`);
    }
  }

  return videos;
};

const promptUserToChooseFormat = async (formats: Format[]): Promise<string> => {
  const { format: formatChoice } = await prompts({
    type: "select",
    name: "format",
    message: "🎞️ Choisissez le format vidéo :",
    choices: formats.map((format) => ({
      title: getFormatTitle(format),
      value: getFormatValue(format),
    })),
  });

  return formatChoice;
};

export const downloadVideo = async ({
  videoUrl,
  filePath,
  format,
  playlistProps,
}: {
  videoUrl: string;
  filePath: string;
  format: string;
  playlistProps?: {
    resolution: number;
    type: MediaType;
  };
}) => {
  const [downloadFormat, recodeFormat] = format.includes("#")
    ? format.split("#")
    : [format, null];

  const options = ["-P", filePath];

  const chosenFormat = playlistProps
    ? getYtDlpFormatString({
        resolutionOrBitrate: playlistProps.resolution,
        format: downloadFormat,
        mediaType: playlistProps.type,
      })
    : downloadFormat;

  options.push("-f", chosenFormat);
  options.push(
    "--print",
    "after_move:filepath",
    // "--ignore-errors",
    "--progress",
    "--verbose"
  );

  // Qu'est ce que c'est ?
  if (recodeFormat) {
    options.push("--recode-video", recodeFormat);
  }

  console.log(`🚀 Téléchargement de la vidéo : ${videoUrl}`);

  try {
    const result = await execa("yt-dlp", [...options, videoUrl], {
      stdio: "pipe", // Capture stdout et stderr au lieu de "inherit"
      reject: false, // Ne pas rejeter la promesse en cas d'erreur
    });

    if (result.failed) {
      console.error(`❌ Erreur lors du téléchargement de ${videoUrl}`);
      console.error(`Stdout : ${result.stdout}`);
      console.error(`Stderr : ${result.stderr}`);
      throw new Error(
        `Échec du téléchargement avec le code ${result.exitCode}`
      );
    }

    console.log(`\n✅ Vidéo téléchargée : ${videoUrl}`);
    return result.stdout.trim(); // Retourne le chemin du fichier téléchargé
  } catch (error) {
    console.error(`❌ Exception lors du téléchargement de ${videoUrl}:`, error);
    throw error;
  }
};

export const downloadYtVideo = async (videoUrl: string) => {
  console.log(`📹 Le lien passé est une vidéo youtube : ${videoUrl}`);

  const [filePath, videoInfos] = await Promise.all([
    promptUserForFilePath(), // User selects a file path
    getVideoInfo(videoUrl), // Fetch video URLs in parallel
  ]);

  const [mediaType, allFormats] = await Promise.all([
    promptUserForMediaType(), // User selects a file path
    getFormats(videoInfos), // Fetch video URLs in parallel
  ]);

  const formats = allFormats[mediaType];
  if (!formats || formats.length === 0) {
    console.error(`❌ Aucun format disponible pour le type ${mediaType}`);
    return;
  }

  const formatValue = await promptUserToChooseFormat(formats);

  await downloadVideo({ videoUrl, filePath, format: formatValue });
};
