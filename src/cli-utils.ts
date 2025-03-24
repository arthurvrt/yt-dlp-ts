import prompts from "prompts";
import {audioOnlyKey, videoKey} from "./format";

/**
 * Demander à l'utilisateur où il veut enregistrer la vidéo.
 */
export const promptUserForFilePath = async (): Promise<string> => {
  const {filePath} = await prompts({
    type: "text",
    name: "filePath",
    message: "🖥️ Où voulez-vous enregistrer la vidéo ?",
    initial: "./", // Dossier par défaut
  });

  return filePath;
};

/**
 * Demander à l'utilisateur s'il veut télécharger l'audio ou la vidéo.
 */
export const promptUserForMediaType = async (): Promise<"audio" | "video"> => {
  const {mediaType} = await prompts({
    type: "select",
    name: "mediaType",
    message: "🎵 Voulez-vous télécharger l'audio ou la vidéo ?",
    choices: [
      {title: "Audio", value: audioOnlyKey},
      {title: "Vidéo", value: videoKey},
    ],
  });

  return mediaType;
};
