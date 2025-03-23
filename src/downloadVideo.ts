import prompts from "prompts";
import { promptUserForFilePath } from "./cli-utils";
import {
  getFormats,
  getFormatTitle,
  getFormatValue,
  getYtDlpFormatString,
} from "./format";
import { Format, Video } from "./types";
import { execa } from "execa";

export const getVideoInfo = async (videoUrl: string): Promise<Video> => {
  try {
    const result = await execa(
      "yt-dlp",
      ["--dump-json", "--format-sort=resolution,ext,tbr", videoUrl].filter(
        (x) => Boolean(x)
      )
    );

    return JSON.parse(result.stdout) as Video;
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

const promptUserToChooseFormat = async (formats: {
  Video: Format[];
  "Audio Only": Format[];
}): Promise<string> => {
  const videoFormats = formats.Video;
  const audioFormats = formats["Audio Only"];

  const { format: formatChoice } = await prompts({
    type: "select",
    name: "format",
    message: "🎞️ Choisissez le format vidéo :",
    choices: [...audioFormats, ...videoFormats].map((format) => ({
      title: getFormatTitle(format),
      value: getFormatValue(format),
    })),
  });

  return formatChoice;
};

/**
 * Télécharge une vidéo avec yt-dlp.
 */
export async function downloadVideoFromPlaylist(
  videoUrl: string,
  resolution: number,
  format: string,
  filePath: string
) {
  const ytDlpFormat = getYtDlpFormatString(resolution, format);
  console.log(`🚀 Téléchargement de la vidéo : ${videoUrl}`);
  try {
    await execa(
      "yt-dlp",
      [
        "--ignore-errors", // Ignore download errors
        "--quiet", // Silent mode (fixed typo)
        "-f",
        ytDlpFormat,
        "-o",
        `${filePath}/%(title)s.%(ext)s`,
        videoUrl,
        "--progress",
      ],
      { stdio: "inherit" }
    );

    console.log(`\n✅ Vidéo téléchargée : ${videoUrl}`);
  } catch (error) {
    console.error(`❌ Erreur lors du téléchargement de ${videoUrl}:`, error);
  }
}

export async function downloadVideo(
  videoUrl: string,
  filePath: string,
  format: string
) {
  const [downloadFormat, recodeFormat] = format.includes("#")
    ? format.split("#")
    : [format, null];

  const options = [
    "-P",
    filePath,
    "-f",
    downloadFormat,
    "--print",
    "after_move:filepath",
  ];
  options.push("--ignore-errors", "--progress");

  if (recodeFormat) {
    options.push("--recode-video", recodeFormat);
  }

  await execa("yt-dlp", [...options, videoUrl], { stdio: "inherit" });
}

export const downloadVideoProcess = async (videoUrl: string) => {
  const filePath = await promptUserForFilePath();

  const videoInfos = await getVideoInfo(videoUrl);
  const formats = getFormats(videoInfos);
  const formatValue = await promptUserToChooseFormat(formats);

  await downloadVideo(videoUrl, filePath, formatValue);
};
