import {runYtDlp} from "./basic";
import {promptUserForFilePath} from "./cli-utils";
import prompts from "prompts";
import {downloadVideo} from "./downloadVideo";

const playlistUrl = process.argv[2];

if (!playlistUrl) {
  console.error("❌ Veuillez fournir une URL de playlist YouTube.");
  process.exit(1);
}

interface FormatInfo {
  format_id: string;
  ext: string;
  height: number | null;
  vcodec: string;
  acodec: string;
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
 * Récupère les formats disponibles pour une vidéo.
 */
const getVideoFormats = async (videoUrl: string): Promise<FormatInfo[]> => {
  try {
    const videoInfo = await runYtDlp([videoUrl]);
    if (!videoInfo || !videoInfo.formats) return null;

    return videoInfo.formats
      .filter((f: any) => f.vcodec !== "none")
      .map((f: any) => ({
        format_id: f.format_id,
        ext: f.ext,
        height: f.height || null,
        vcodec: f.vcodec,
        acodec: f.acodec,
      }));
  } catch (error) {
    return null;
  }
};

/**
 * Trouve les formats communs à toutes les vidéos d'une playlist.
 */

type Resolution = number;
type Extension = string;
type AvailableFormats = Record<Resolution, Set<Extension>>;

const getCommonFormats = async (videoUrls: string[]) => {
  console.log("📂 Analyse des formats disponibles...");
  console.log(`🔍 Analyse de ${videoUrls.length} vidéos...`);

  let videoCount = 0; // Compteur pour les vidéos
  let errorCount = 0; // Compteur pour les erreurs
  const allFormats = await Promise.all(
    videoUrls.map(async (url) => {
      try {
        const formats = await getVideoFormats(url);
        videoCount++;
        console.log(`🔍 Analyse de la vidéo ${videoCount}...`);
        if (!formats) {
          errorCount++;
        }
        return formats;
      } catch (error) {
        errorCount++;
        return null;
      }
    })
  );

  // Afficher le nombre d'erreurs
  console.log(
    `\n❌ ${errorCount} non trouvé(s) ou erreur(s) lors de l'analyse.`
  );

  // Filtrer les résultats nuls (erreurs)
  const validFormats = allFormats.filter((format) => format !== null);
  console.log(`🔍 Analyse de ${validFormats.length} vidéos réussie.`);

  // Récupérer les résolutions et formats communs
  const resolutionOptions = [1080, 720, 480, 360];
  const availableFormats: AvailableFormats = {};

  resolutionOptions.forEach((res) => (availableFormats[res] = new Set()));

  validFormats.flat().forEach((format) => {
    if (format.height && resolutionOptions.includes(format.height)) {
      availableFormats[format.height].add(format.ext);
    }
  });

  return availableFormats;
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
