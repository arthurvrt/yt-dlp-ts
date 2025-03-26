import { isYoutubePlaylist, processVideoUrl } from "./basic";
import { downloadYtPlaylist } from "./downloadPlaylist";
import { downloadYtVideo } from "./downloadVideo";

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

const isPlaylist = isYoutubePlaylist(url);

async function downloadContent() {
  try {
    if (isPlaylist) {
      await downloadYtPlaylist(url);
    } else {
      const processedUrl = processVideoUrl(url);
      await downloadYtVideo(processedUrl);
    }

    logDuration(startTime);
  } catch (error) {
    console.error("Error downloading content:", error.message);
    process.exit(1);
  }
}

downloadContent();
