import { execa } from "execa";

/**
 * Exécute yt-dlp et retourne le JSON parsé.
 */
export async function runYtDlp(args: string[]) {
  try {
    const { stdout } = await execa("yt-dlp", [...args, "--dump-single-json"]);
    return JSON.parse(stdout);
  } catch (error) {
    // console.error("❌ Erreur lors de l'exécution de yt-dlp :", error);
    console.error("❌ Erreur lors de l'exécution de yt-dlp :");
    return null;
  }
}

/**
 * Vérifie si le lien est une playlist YouTube ou une vidéo YouTube.
 */
export function isYoutubePlaylist(link: string): boolean {
  const playlistRegex = /[?&]list=([^#&?]+)/;
  return playlistRegex.test(link);
}

export function isYoutubeVideo(link: string): boolean {
  const videoRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  return videoRegex.test(link);
}
