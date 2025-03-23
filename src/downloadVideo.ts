import prompts from "prompts";
import { runYtDlp } from "./basic";
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
  const result = await runYtDlp(
    ["--format-sort=resolution,ext,tbr", videoUrl].filter((x) => Boolean(x))
  );

  return JSON.parse(result.stdout) as Video;
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
}): Promise<Format> => {
  const videoFormats = formats.Video.map((format) => ({
    title: getFormatTitle(format),
    value: getFormatValue(format),
  }));
  const audioFormats = formats["Audio Only"].map((format) => ({
    title: getFormatTitle(format),
    value: getFormatValue(format),
  }));

  const { format: formatChoice } = await prompts({
    type: "select",
    name: "format",
    message: "🎞️ Choisissez le format vidéo :",
    choices: [...audioFormats, ...videoFormats].map(({ title, value }) => ({
      title: title.toUpperCase(),
      value: value,
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
  const [downloadFormat, recodeFormat] = format.split("#");

  const options = [];
  options.push("--format", downloadFormat);
  options.push("--recode-video", recodeFormat);
  options.push("--print", "after_move:filepath");

  const process = await execa(
    "yt-dlp",
    [
      ...options,
      "--ignore-errors", // Ignore download errors
      "-f",
      "-o",
      `${filePath}/%(title)s.%(ext)s`,
      videoUrl,
      "--progress",
    ],
    { stdio: "inherit" }
  );
}

export const downloadVideoProcess = async (videoUrl: string) => {
  const filePath = await promptUserForFilePath();

  const videoInfos = await getVideoInfo(videoUrl);
  const formats = getFormats(videoInfos);
  const format = await promptUserToChooseFormat(formats);
  const formatValue = getFormatValue(format);

  await downloadVideo(videoUrl, filePath, formatValue);
};
