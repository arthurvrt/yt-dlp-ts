# YouTube Video Downloader Script

This script allows you to download YouTube videos (or playlists) using the best available quality. It relies on `yt-dlp` for downloading and optionally uses `ffmpeg` for merging video and audio streams for high-resolution videos.
Installation and Usage
Installing yt-dlp
Before using this project, make sure yt-dlp is installed on your system. Here’s how to install it based on your operating system:

## Installing `yt-dlp`

Before using this project, make sure `yt-dlp` is installed on your system. Here’s how to install it based on your operating system:

### macOS

```
sh
CopyEdit
brew install yt-dlp

```

### Linux

```
sh
CopyEdit
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

```

### Windows

Download the executable from [the releases page](https://github.com/yt-dlp/yt-dlp/releases/latest) and place it in a folder accessible from your terminal.

## Installing Dependencies

You can use any of the following package managers:

```
sh
CopyEdit
npm install
# or
pnpm install
# or
yarn install

```

## Running the CLI

To run the CLI, use the following command:

```
sh
CopyEdit
tsx src/cli.ts <url>

```

Replace `<url>` with the URL of the YouTube video or playlist you want to process.
