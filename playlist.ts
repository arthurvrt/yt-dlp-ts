import { spawn } from "child_process";
import { formatQuality, VideoFormat } from "./video-playlist";
import { getVideoFromId, getVideosFromIds } from "./video";
import { isValidUrl, Video } from "./quality";
import { execa } from "execa";

export const getPlaylistVideoUrls = (
  playlistUrl: string
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const process = spawn("yt-dlp", [
      "--flat-playlist",
      "--print",
      "url",
      playlistUrl,
    ]);

    let urls: string[] = [];
    let errorOutput = "";

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error("yt-dlp error:", data.toString());
    });

    process.stdout.on("data", (data) => {
      const output = data.toString();
      urls = urls.concat(output.split("\n").filter(Boolean));
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(urls);
      } else {
        reject(new Error("Failed to retrieve video URLs from playlist"));
      }
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
};

export const getPlaylistSize = (url: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const process = spawn("yt-dlp", ["--flat-playlist", "--print", "id", url]);

    let videoCount = 0;
    process.stdout.on("data", (data) => {
      const output = data.toString();
      videoCount += output.split("\n").filter(Boolean).length;
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(videoCount);
      } else {
        reject(new Error("Failed to retrieve playlist size"));
      }
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
};

export const getVideosIdFromPlaylist = async (
  playlistUrl: string
): Promise<string[]> => {
  if (!isValidUrl(playlistUrl)) {
    throw new Error("Invalid playlist URL");
  }

  try {
    const process = execa("yt-dlp", [
      "--flat-playlist",
      "--print",
      "id",
      playlistUrl,
    ]);

    return new Promise((resolve, reject) => {
      let output = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          const videoIds = output.split("\n").filter(Boolean);
          resolve(videoIds);
        } else {
          reject(new Error("Failed to retrieve video IDs from playlist"));
        }
      });

      process.on("error", (err) => {
        console.error("yt-dlp stderr:", err.toString());
      });
    });
  } catch (err) {
    throw new Error("Failed to process playlist");
  }
};

export const getVideoFromPlaylist = async (
  playlistUrl: string
): Promise<Video[]> => {
  const videoIds = await getVideosIdFromPlaylist(playlistUrl);
  return getVideosFromIds(videoIds);
};
