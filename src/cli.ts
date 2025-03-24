import {isYoutubePlaylist, processUrl} from "./basic";
import {downloadYouTubePlaylistInParalelle} from "./downloadPlaylist";
import {downloadVideoProcess} from "./downloadVideo";

const [, , url] = process.argv; // Get the third CLI argument

if (!url) {
  console.error("Usage: node cli.js <playlist-url>");
  process.exit(1);
}

const startTime = Date.now();

// Function to calculate and print the duration
const logDuration = (startTime) => {
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // Convert to seconds
  console.log(`Time taken: ${duration.toFixed(2)} seconds`);
};

const processedUrl = processUrl(url);

const isPlaylist = isYoutubePlaylist(processedUrl);

async function downloadContent() {
  try {
    if (isPlaylist) {
      await downloadYouTubePlaylistInParalelle(processedUrl);
    } else {
      await downloadVideoProcess(processedUrl);
    }

    logDuration(startTime);
  } catch (error) {
    console.error("Error downloading content:", error.message);
    process.exit(1);
  }
}

downloadContent();
