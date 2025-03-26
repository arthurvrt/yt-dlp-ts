import { formatDuration, intervalToDuration } from "date-fns";
import { getVideoInfo } from "./downloadVideo";
import { Format, Video } from "./types";

export function formatHHMM(seconds: number) {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });

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

const hasCodec = ({ vcodec, acodec }: Format) => {
  return {
    hasVcodec: Boolean(vcodec) && vcodec !== "none",
    hasAcodec: Boolean(acodec) && acodec !== "none",
  };
};

export const videoKey = "Video";
export const audioOnlyKey = "Audio Only";

export const getFormats = (video?: Video) => {
  const videoWithAudio: Format[] = [];
  const audioOnly: Format[] = [];

  if (!video) return { [videoKey]: videoWithAudio, [audioOnlyKey]: audioOnly };

  for (const format of video.formats.slice().reverse()) {
    const { hasAcodec, hasVcodec } = hasCodec(format);
    if (hasVcodec) videoWithAudio.push(format);
    else if (hasAcodec || format.resolution === "audio only")
      audioOnly.push(format);
    else continue;
  }

  return { [videoKey]: videoWithAudio, [audioOnlyKey]: audioOnly };
};

export const getFormatValue = (format: Format) => {
  const { hasAcodec } = hasCodec(format);
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
 * Generates a yt-dlp format string for audio with logical fallbacks.
 */
export const getYtDlpAudioFormatString = ({
  bitrate,
  preferredFormats,
}: {
  bitrate: number;
  preferredFormats?: string[];
}): string => {
  const formatFallbacks = preferredFormats
    .map((fmt) => `ba[abr<=${bitrate}][ext=${fmt}]`)
    .join(" / ");

  return `(${formatFallbacks} / ba[abr<=${bitrate}] / ba / a)`;
};

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

// /**
//  * Récupère les formats disponibles pour une vidéo.
//  */
// export const getVideoFormats = async (
//   videoUrl: string
// ): Promise<FormatInfo[]> => {
//   try {
//     const videoInfo = await runYtDlp([videoUrl]);
//     if (!videoInfo || !videoInfo.formats) return null;

//     return videoInfo.formats
//       .filter((f: any) => f.vcodec !== "none")
//       .map((f: any) => ({
//         format_id: f.format_id,
//         ext: f.ext,
//         height: f.height || null,
//         vcodec: f.vcodec,
//         acodec: f.acodec,
//       }));
//   } catch (error) {
//     return null;
//   }
// };

/**
 * Trouve les formats communs à toutes les vidéos d'une playlist.
 */
type ResolutionOrBitrate = number;
type Extension = string;
export type AvailableFormats = Record<ResolutionOrBitrate, Set<Extension>>;

type CommonFormats = {
  [videoKey]: AvailableFormats[];
  [audioOnlyKey]: AvailableFormats[];
};

export const getCommonFormats = async (videoUrls: string[]) => {
  console.log(`🔍 Analyse de ${videoUrls.length} vidéos...`);

  let videoCount = 0; // Compteur pour les vidéos
  let errorCount = 0; // Compteur pour les erreurs
  const allFormats = await Promise.all(
    videoUrls.map(async (url) => {
      try {
        const videoInfos = await getVideoInfo(url);
        const formats = getFormats(videoInfos);
        videoCount++;
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

  if (errorCount === 0) {
    console.log(`\n✅ Toutes les vidéos ont été analysées avec succès.`);
  } else {
    console.log(
      `\n❌ ${errorCount} non trouvé(s) ou erreur(s) lors de l'analyse.`
    );
  }

  // Filtrer les résultats nuls (erreurs)b

  const validVideoFormats = allFormats
    .filter((formats) => formats !== null)
    .map((formats) => formats![videoKey]);

  // Récupérer les résolutions et formats communs
  const resolutionOptions = [1080, 720, 480, 360];
  const availableVideoFormats: AvailableFormats = {};

  resolutionOptions.forEach((res) => (availableVideoFormats[res] = new Set()));

  validVideoFormats.flat().forEach((format) => {
    if (format.height && resolutionOptions.includes(format.height)) {
      availableVideoFormats[format.height].add(format.ext);
    }
  });

  const bitrateRange = [64, 128, 192, 256, 320, 512];
  const availableAudioFormats: AvailableFormats = {};

  bitrateRange.forEach(
    (bitrate) => (availableAudioFormats[bitrate] = new Set())
  );

  const validAudioFormats = allFormats
    .filter((formats) => formats !== null)
    .map((formats) => formats![audioOnlyKey]);

  console.log("validAudioFormats", validAudioFormats.length);
  console.log("validAudioFormats", validAudioFormats);

  validAudioFormats.flat().forEach((format) => {
    const closestBitrate = bitrateRange.reduce((prev, curr) =>
      Math.abs(curr - format.abr) < Math.abs(prev - format.abr) ? curr : prev
    );

    // console.log("closestBitrate", closestBitrate);

    availableAudioFormats[closestBitrate].add(format.ext);
  });

  return {
    [videoKey]: availableVideoFormats,
    [audioOnlyKey]: availableAudioFormats,
  };
};
