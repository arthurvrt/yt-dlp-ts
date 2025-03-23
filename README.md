# YouTube Video Downloader Script

This script allows you to download YouTube videos (or playlists) using the best available quality. It relies on `yt-dlp` for downloading and optionally uses `ffmpeg` for merging video and audio streams for high-resolution videos.

## Features

- Downloads videos or playlists from YouTube.
- Automatically merges video and audio streams for resolutions higher than 720p (requires `ffmpeg`).
- Customizable output format and directory.
- Supports retries for failed downloads.
- Displays a real-time progress bar during downloads.

## Prerequisites

Before using this script, ensure the following tools are installed and available in your system's PATH:

### 1. [yt-dlp](https://github.com/yt-dlp/yt-dlp)

`yt-dlp` is a powerful command-line tool for downloading videos from YouTube and other sites.

- Install using `pip`:
  ```python
  pip install -U yt-dlp
  ```
- Alternatively, download the binary:
  ```python
  curl -L https://yt-dlp.org/downloads/latest/yt-dlp -o /usr/local/bin/yt-dlp
  chmod a+rx /usr/local/bin/yt-dlp
  ```

### 2. [ffmpeg](https://ffmpeg.org/)

`ffmpeg` is required for merging video and audio streams for high-resolution videos (above 720p).

- Install on Ubuntu/Debian:
  ```python
  sudo apt update
  sudo apt install ffmpeg
  ```
- Install on macOS (using Homebrew):
  ```python
  brew install ffmpeg
  ```
- Install on Windows:
  Download the prebuilt binaries from the [ffmpeg website](https://ffmpeg.org/download.html) and add them to your PATH.

## Installation

1. Clone this repository or copy the script file:

   ```bash
   git clone https://github.com/your-username/youtube-downloader.git
   cd youtube-downloader
   ```

2. Ensure the required dependencies (`yt-dlp` and `ffmpeg`) are installed.

## Usage

### Basic Usage

Run the script with the URL of the video or playlist as an argument:

```bash
node downloader.js <video_or_playlist_url>
```

### Options

The script supports the following optional parameters:

- `outputFormat`: The format of the downloaded video (default: `mp4`).
- `outputPath`: The directory where the downloaded file(s) will be saved (default: `.`).
- `maxRetries`: The maximum number of retry attempts for failed downloads (default: `3`).

### Example

To download a YouTube video or playlist to the `downloads` folder:

### Playlist Support

To download all videos in a playlist, simply provide the playlist URL:

## Script Features

1. **Progress Bar**: A dynamic progress bar displays the current download percentage.
2. **Retries**: Automatically retries failed downloads up to the specified number of attempts.
3. **Error Handling**: Provides meaningful error messages in case of issues.

## Known Limitations

- Without `ffmpeg`, video resolution is limited to 720p when merging video and audio streams.

## Contributing

Feel free to fork the repository and submit pull requests to enhance the functionality or fix bugs.

## License

This project is licensed under the MIT License.
