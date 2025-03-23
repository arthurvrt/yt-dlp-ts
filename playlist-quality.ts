import { getVideosIdFromPlaylist } from "./playlist";
import { spawn } from "child_process";
import { getVideo } from "./video";
import { getFormats } from "./quality";

export interface CommonFormat {
  ext: string | null;
  resolution: string | null;
  formatId: string | null;
}

export const listVideoFormats = async (
  videoUrl: string
): Promise<CommonFormat[]> => {
  try {
    const process = spawn("yt-dlp", ["--list-formats", videoUrl]);

    return new Promise((resolve, reject) => {
      let output = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.on("close", async (code) => {
        if (code === 0) {
          try {
            // Parse the formats output
            const formatLines = output
              .split("\n")
              .filter((line) => line.match(/^\d/)) // Only lines starting with format ID
              .map((line) => {
                const [formatId, ext, resolution] = line
                  .split(/\s+/)
                  .filter(Boolean);
                return {
                  ext,
                  resolution: resolution || null,
                  formatId,
                };
              });
            resolve(formatLines);
          } catch (err) {
            reject(err);
          }
        } else {
          // resolve([]);
          // console.error("yt-dlp stderr:", output);
          if (output.includes("Video unavailable")) {
            console.log("Video unavailable");

            // Skip the unavailable video
            resolve([]); // Return an empty array for this video
          } else {
            // console.error("yt-dlp stderr:", output);
            reject(new Error("Failed to list formats from video"));
          }
        }
      });

      process.on("error", (err) => {
        // resolve([]);
        // console.error("yt-dlp stderr:", output);
        if (output.includes("Video unavailable")) {
          console.log("Video unavailable");

          // Skip the unavailable video
          resolve([]); // Return an empty array for this video
        } else {
          // console.error("yt-dlp stderr:", err);
          reject(new Error("Failed to list formats from video"));
        }
      });
    });
  } catch (error) {
    console.error("Error listing video formats:", error);
    throw error;
  }
};

export const customListVideoFormats = async (
  videoUrl: string
): Promise<CommonFormat[]> => {
  try {
    const video = await getVideo(videoUrl);
    const formats = getFormats(video);
    const allFormats = [...formats["Audio Only"], ...formats["Video"]];

    return allFormats.map((format) => ({
      ext: format.ext,
      resolution: format.resolution,
      formatId: format.format_id,
    }));
  } catch (error) {
    console.error("Error listing video formats:", error);
  }
};

export async function findCommonFormat(
  playlistUrl: string
): Promise<CommonFormat[]> {
  try {
    const videoIds = await getVideosIdFromPlaylist(playlistUrl);
    console.log(`🔍 Analyse de ${videoIds.length} vidéos...`);

    if (videoIds.length === 0) {
      throw new Error("Playlist is empty or not accessible");
    }

    // Fetch formats for all videos in parallel
    const videoFormatsArray = await Promise.allSettled(
      videoIds.map((videoId) =>
        listVideoFormats(`https://www.youtube.com/watch?v=${videoId}`)
      )
    );
    // console.log("videoFormatsArray:", videoFormatsArray);

    const successfulFormats = videoFormatsArray
      .filter((result) => result.status === "fulfilled")
      .filter((result) => result?.value !== undefined) // Ensure value is not undefined
      .filter(
        (result) => Array.isArray(result.value) && result.value.length > 0
      ) // Check if value is an array and has items
      .map((result) => result.value); // Get the value (formats) from the fulfilled results

    const failedFormats = videoFormatsArray
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason); // Get the error (reason) from the rejected results

    // console.log("failedFormats", failedFormats);
    // console.log("successfulFormats", successfulFormats);

    // Convert the first video's formats into a Set of JSON strings
    let commonFormats = new Set(
      successfulFormats[0].map((format) =>
        JSON.stringify({
          ext: format.ext,
          resolution: format.resolution,
          formatId: format.formatId,
        })
      )
    );

    // Compare with other videos
    for (let i = 1; i < successfulFormats.length; i++) {
      const currentFormatStrings = new Set(
        successfulFormats[i].map((format) =>
          JSON.stringify({
            ext: format.ext,
            resolution: format.resolution,
            formatId: format.formatId,
          })
        )
      );

      // Keep only formats that exist in both sets
      commonFormats = new Set(
        Array.from(commonFormats).filter((format) =>
          currentFormatStrings.has(format)
        )
      );

      // If no common formats left, we can stop early
      if (commonFormats.size === 0) {
        return [
          {
            ext: null,
            resolution: null,
            formatId: null,
          },
        ];
      }
    }

    // Convert all common formats back to objects
    return Array.from(commonFormats).map(
      (format) => JSON.parse(format) as CommonFormat
    );
  } catch (error) {
    console.error("Error finding common format:", error);
    throw error;
  }
}
