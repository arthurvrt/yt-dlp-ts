import { execa } from "execa";
import { Video } from "./quality";
import { CommonFormat } from "./playlist-quality";

export const getVideo = async (videoUrl: string): Promise<Video> => {
  const result = await execa(
    "yt-dlp",
    ["--dump-json", "--format-sort=resolution,ext,tbr", videoUrl].filter((x) =>
      Boolean(x)
    )
  );

  return JSON.parse(result.stdout) as Video;
};

export const getVideoFromId = async (videoId: string): Promise<Video> => {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return getVideo(videoUrl);
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

// export async function getVideoFormat(
//   videoUrl: string
// ): Promise<CommonFormat[]> {
//   return new Promise((resolve, reject) => {
//     // Lance yt-dlp avec l'option --list-formats pour récupérer les formats de la vidéo
//     const process = execa("yt-dlp", ["--list-formats", videoUrl]);

//     let output = "";

//     // Collecte les données de la sortie standard (stdout)
//     process.stdout.on("data", (data) => {
//       output += data.toString();
//     });

//     // Lorsque le processus se termine
//     process.on("close", (code) => {
//       if (code === 0) {
//         try {
//           // Parse la sortie pour extraire les formats
//           const formatLines = output
//             .split("\n")
//             .filter((line) => line.match(/^\d/)) // Ne garde que les lignes commençant par un ID de format
//             .map((line) => {
//               const [formatId, ext, resolution] = line
//                 .split(/\s+/)
//                 .filter(Boolean);
//               return {
//                 formatId,
//                 ext,
//                 resolution: resolution || null,
//               };
//             });

//           // Résout la promesse avec les formats
//           resolve(formatLines);
//         } catch (err) {
//           reject(new Error("Failed to parse format output"));
//         }
//       } else {
//         reject(new Error("Failed to retrieve formats"));
//       }
//     });

//     // Gestion des erreurs de processus
//     process.on("error", (err) => {
//       reject(err);
//     });
//   });
// }
