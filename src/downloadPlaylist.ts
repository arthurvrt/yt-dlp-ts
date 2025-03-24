import {runYtDlp} from "./basic";
import {promptUserForFilePath} from "./cli-utils";
import prompts from "prompts";
import {downloadVideo} from "./downloadVideo";
import {AvailableFormats, getCommonFormats} from "./format";

const playlistUrl = process.argv[2];

if (!playlistUrl) {
  console.error("❌ Veuillez fournir une URL de playlist YouTube.");
  process.exit(1);
}

/**
 * Récupère les vidéos d'une playlist.
 */
const getPlaylistVideos = async (playlistUrl: string): Promise<string[]> => {
  const playlistInfo = await runYtDlp(["--flat-playlist", playlistUrl]);
  if (!playlistInfo || !playlistInfo.entries) return [];

  console.log(`📂 ${playlistInfo.entries.length} vidéos trouvées.`);

  return playlistInfo.entries.map((entry: any) => entry.url);
};

/**
 * Permet à l'utilisateur de choisir la résolution et le format.
 */
const promptUserForFormat = async (availableFormats: AvailableFormats) => {
  const {resolution} = await prompts({
    type: "select",
    name: "resolution",
    message: "\n📺 Choisissez la résolution souhaitée :",
    choices: Object.keys(availableFormats)
      .map(Number)
      .filter((res) => availableFormats[res].size > 0)
      .sort((a, b) => b - a)
      .map((res) => ({title: `${res}p`, value: res})),
  });

  const {format} = await prompts({
    type: "select",
    name: "format",
    message: "🎞️ Choisissez le format vidéo :",
    choices: Array.from(availableFormats[resolution]).map((ext) => ({
      title: ext.toUpperCase(),
      value: ext,
    })),
  });

  return {resolution, format};
};

/**
 * Télécharge toutes les vidéos d'une playlist en parallèle.
 */
const downloadPlaylist = async (
  videoUrls: string[],
  resolution: number,
  format: string,
  filePath: string
) => {
  console.log(`\n🚀 Téléchargement des ${videoUrls.length} vidéos en cours...`);

  // Lancer les téléchargements en parallèle
  const downloadPromises = videoUrls.map((videoUrl) =>
    downloadVideo({videoUrl, format, filePath, resolution})
  );

  // Attendre que tous les téléchargements soient terminés
  await Promise.all(downloadPromises);
  console.log("\n✅ Tous les téléchargements sont terminés !");
};

/**
 * Exécute le processus de téléchargement de playlist.
 */
export const downloadYouTubePlaylistInParalelle = async (
  playlistUrl: string
) => {
  const filePath = await promptUserForFilePath();
  // Récupérer les URLs des vidéos de la playlist
  const videoUrls = await getPlaylistVideos(playlistUrl);
  if (videoUrls.length === 0) {
    console.log("❌ Aucune vidéo trouvée dans la playlist.");
    return;
  }
  const availableFormats = await getCommonFormats(videoUrls);
  if (!availableFormats) return;

  const {resolution, format} = await promptUserForFormat(availableFormats);
  await downloadPlaylist(videoUrls, resolution, format, filePath);
};
