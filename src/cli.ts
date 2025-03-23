import { isYoutubePlaylist } from "./basic";
import { downloadYouTubePlaylistInParalelle } from "./downloadPlaylist";
import { downloadVideoProcess } from "./downloadVideo";
import { validateUrl } from "./validation";

const [, , url] = process.argv; // Get the third CLI argument

if (!url) {
  console.error("Usage: node cli.js <playlist-url>");
  process.exit(1);
}

const startTime = Date.now();

validateUrl(url);

const isPlaylist = isYoutubePlaylist(url);

if (isPlaylist) {
  downloadYouTubePlaylistInParalelle(url).then((result) => {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds

    console.log(`Time taken: ${duration.toFixed(2)} seconds`);
  });
} else {
  downloadVideoProcess(url).then(() => {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds

    console.log(`Time taken: ${duration.toFixed(2)} seconds`);
  });
}
