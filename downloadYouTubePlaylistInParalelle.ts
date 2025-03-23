import { execa } from "execa";
import prompts from "prompts";

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
 * Demander à l'utilisateur où il veut enregistrer la vidéo.
 */
async function promptUserForFilePath() {
  const { filePath } = await prompts({
    type: "text",
    name: "filePath",
    message: "🖥️ Où voulez-vous enregistrer la vidéo ?",
    initial: "./", // Dossier par défaut
  });

  return filePath;
}

/**
 * Exécute yt-dlp et retourne le JSON parsé.
 */
async function runYtDlp(args: string[]) {
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
 * Récupère les vidéos d'une playlist.
 */
async function getPlaylistVideos(playlistUrl: string): Promise<string[]> {
  const playlistInfo = await runYtDlp(["--flat-playlist", playlistUrl]);
  if (!playlistInfo || !playlistInfo.entries) return [];

  console.log(`📂 ${playlistInfo.entries.length} vidéos trouvées.`);

  return playlistInfo.entries.map((entry: any) => entry.url);
}

/**
 * Récupère les formats disponibles pour une vidéo.
 */
async function getVideoFormats(videoUrl: string): Promise<FormatInfo[]> {
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
}

/**
 * Trouve les formats communs à toutes les vidéos d'une playlist.
 */

type Resolution = number;
type Extension = string;
type AvailableFormats = Record<Resolution, Set<Extension>>;
async function getCommonFormats(videoUrls: string[]) {
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
}

/**
 * Permet à l'utilisateur de choisir la résolution et le format.
 */
async function promptUserForFormat(availableFormats: AvailableFormats) {
  const { resolution } = await prompts({
    type: "select",
    name: "resolution",
    message: "\n📺 Choisissez la résolution souhaitée :",
    choices: Object.keys(availableFormats)
      .map(Number)
      .filter((res) => availableFormats[res].size > 0)
      .sort((a, b) => b - a)
      .map((res) => ({ title: `${res}p`, value: res })),
  });

  const { format } = await prompts({
    type: "select",
    name: "format",
    message: "🎞️ Choisissez le format vidéo :",
    choices: Array.from(availableFormats[resolution]).map((ext) => ({
      title: ext.toUpperCase(),
      value: ext,
    })),
  });

  return { resolution, format };
}

/**
 * Génère la commande yt-dlp avec fallback logique.
 */
function getYtDlpFormatString(resolution: number, format: string): string {
  return `((bv*[height<=${resolution}][ext=${format}]+ba/b[height<=${resolution}][ext=${format}]) 
          / (bv*[height<${resolution}]+ba/b[height<${resolution}]) 
          / (b[height<=${resolution}] / w[height<=${resolution}]))
          / (b/w))`;
}

/**
 * Télécharge une vidéo avec yt-dlp.
 */
async function downloadVideo(
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
        "--ignore-errors", // Ignore les erreurs de téléchargement
        "--quite", // Mode silencieux
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

/**
 * Télécharge toutes les vidéos d'une playlist en parallèle.
 */
async function downloadPlaylist(
  videoUrls: string[],
  resolution: number,
  format: string,
  filePath: string
) {
  console.log(`\n🚀 Téléchargement des ${videoUrls.length} vidéos en cours...`);

  // Lancer les téléchargements en parallèle
  const downloadPromises = videoUrls.map((videoUrl) =>
    downloadVideo(videoUrl, resolution, format, filePath)
  );

  // Attendre que tous les téléchargements soient terminés
  await Promise.all(downloadPromises);
  console.log("\n✅ Tous les téléchargements sont terminés !");
}

/**
 * Exécute le processus de téléchargement de playlist.
 */
export async function downloadYouTubePlaylistInParalelle(playlistUrl: string) {
  const filePath = await promptUserForFilePath();
  // Récupérer les URLs des vidéos de la playlist
  const videoUrls = await getPlaylistVideos(playlistUrl);
  if (videoUrls.length === 0) {
    console.log("❌ Aucune vidéo trouvée dans la playlist.");
    return;
  }
  const availableFormats = await getCommonFormats(videoUrls);
  if (!availableFormats) return;

  const { resolution, format } = await promptUserForFormat(availableFormats);
  await downloadPlaylist(videoUrls, resolution, format, filePath);
}
