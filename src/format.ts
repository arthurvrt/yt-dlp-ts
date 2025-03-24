import {formatDuration, intervalToDuration} from "date-fns";
import {Format, Video} from "./types";

export function formatHHMM(seconds: number) {
  const duration = intervalToDuration({start: 0, end: seconds * 1000});

  return formatDuration(duration, {
    format:
      duration.hours && duration.hours > 0
        ? ["hours", "minutes", "seconds"]
        : ["minutes", "seconds"],
    zero: true,
    delimiter: ":",
    locale: {
      formatDistance: (_token, count) => String(count).padStart(2, "0"),
    },
  });
}

export function formatTbr(tbr: number | null) {
  if (!tbr) return "";
  return `${Math.floor(tbr)} kbps`;
}

export function formatFilesize(filesize?: number, filesizeApprox?: number) {
  const size = filesize || filesizeApprox;
  if (!size) return "";

  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 ** 2) {
    return `${(size / 1024).toFixed(2)} KiB`;
  }
  if (size < 1024 ** 3) {
    return `${(size / 1024 ** 2).toFixed(2)} MiB`;
  }
  return `${(size / 1024 ** 3).toFixed(2)} GiB`;
}

const hasCodec = ({vcodec, acodec}: Format) => {
  return {
    hasVcodec: Boolean(vcodec) && vcodec !== "none",
    hasAcodec: Boolean(acodec) && acodec !== "none",
  };
};

export const getFormats = (video?: Video) => {
  const videoKey = "Video";
  const audioOnlyKey = "Audio Only";
  const videoWithAudio: Format[] = [];
  const audioOnly: Format[] = [];

  if (!video) return {[videoKey]: videoWithAudio, [audioOnlyKey]: audioOnly};

  for (const format of video.formats.slice().reverse()) {
    const {hasAcodec, hasVcodec} = hasCodec(format);
    if (hasVcodec) videoWithAudio.push(format);
    else if (hasAcodec && !hasVcodec) audioOnly.push(format);
    else continue;
  }

  return {[videoKey]: videoWithAudio, [audioOnlyKey]: audioOnly};
};

export const getFormatValue = (format: Format) => {
  const {hasAcodec} = hasCodec(format);
  const audio = hasAcodec ? "" : "+bestaudio";
  const targetExt = `#${format.ext}`;
  return format.format_id + audio + targetExt;
};

export const getFormatTitle = (format: Format) =>
  [
    format.resolution,
    format.ext,
    formatTbr(format.tbr),
    formatFilesize(format.filesize),
  ]
    .filter((x) => Boolean(x))
    .join(" | ");

/**
 * Génère la commande yt-dlp avec fallback logique.
 */
export const getYtDlpFormatString = ({
  resolution,
  format,
}: {
  resolution: number;
  format: string;
}): string => {
  return (
    `((bv*[height<=${resolution}][ext=${format}]+ba/b[height<=${resolution}][ext=${format}])` +
    ` / (bv*[height<=${resolution}]+ba/b[height<=${resolution}])` +
    ` / (b[height<=${resolution}])` +
    ` / (w[height<=${resolution}])` +
    ` / (b/w))`
  );
};
