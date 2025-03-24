import prompts from "prompts";

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
