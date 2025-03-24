import {execa} from "execa";
import {validateUrl} from "./validation";

/**
 * Exécute yt-dlp et retourne le JSON parsé.
 */
export const runYtDlp = async (args: string[]) => {
  try {
    const {stdout} = await execa("yt-dlp", [...args, "--dump-single-json"]);
    return JSON.parse(stdout);
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de l'exécution de yt-dlp :",
      error.stderr || error.message
    );
    return null;
  }
};

/**
 * Vérifie si le lien est une playlist YouTube ou une vidéo YouTube.
 */
export const isYoutubePlaylist = (link: string): boolean => {
  const playlistRegex = /playlist\?list=([^#&?]+)/;
  return playlistRegex.test(link);
};

export const processUrl = (url: string): string => {
  const cleanUrl = url.trim();
  validateUrl(cleanUrl);
  console.log(`🔗 Lien YouTube valide : ${cleanUrl}`);

  return toClassicYoutubeUrl(cleanUrl);
};

/**
 * Transforme une URL YouTube en une URL classique de vidéo YouTube.
 */
export function toClassicYoutubeUrl(link: string): string | null {
  try {
    const url = new URL(link);
    const videoId = url.searchParams.get("v");

    if (!videoId) {
      throw new Error("Invalid URL");
    }
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`🔗 Lien transformé : ${videoUrl}`);
    return videoUrl;
  } catch (error) {
    console.error("❌ Erreur lors de la transformation de l'URL :", error);
    throw new Error("Invalid URL");
  }
}
