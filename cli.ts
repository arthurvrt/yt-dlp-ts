import { downloadYouTubePlaylistInParalelle } from "./downloadYouTubePlaylistInParalelle";

const [, , url] = process.argv; // Get the third CLI argument

if (!url) {
  console.error("Usage: node cli.js <playlist-url>");
  process.exit(1);
}

// const startTime = Date.now();
// getCommonFormatsTest2(url)
//   .then((result) => {
//     const endTime = Date.now();
//     const duration = (endTime - startTime) / 1000; // Convert to seconds
//     if (result) {
//       console.log(
//         `\n📜 ${result.commonResolutions.length} Formats communs à toutes les vidéos :`
//       );
//       result.commonResolutions.forEach((fmt) => console.log(`- ${fmt}`));

//       console.log("\n🎯 Options supplémentaires :");
//       Object.entries(result.presetOptions).forEach(([label, option]) => {
//         console.log(`- ${label} (${option})`);
//       });
//     }

//     console.log(`Time taken: ${duration.toFixed(2)} seconds`);
//   })
//   .catch((error) => {
//     console.error("Error:", error.message);
//     process.exit(1);
//   });

// const startTime = Date.now();
// findCommonFormat(url)
//   .then((result) => {
//     const endTime = Date.now();
//     const duration = (endTime - startTime) / 1000; // Convert to seconds
//     if (result) {
//       console.log(`${result.length} formats`);
//       console.log(
//         "\n📜 Formats:",
//         result.sort((a, b) => a.formatId.localeCompare(b.formatId))
//       );
//     }

//     console.log(`Time taken: ${duration.toFixed(2)} seconds`);
//   })
//   .catch((error) => {
//     console.error("Error:", error.message);
//     process.exit(1);
//   });

const startTime = Date.now();
downloadYouTubePlaylistInParalelle(url).then((result) => {
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // Convert to seconds

  console.log(`Time taken: ${duration.toFixed(2)} seconds`);
});
