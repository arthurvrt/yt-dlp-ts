export type Format = {
  format_id: string;
  vcodec: string;
  acodec: string;
  ext: string;
  video_ext: string;
  protocol: string;
  filesize?: number;
  filesize_approx?: number;
  resolution: string;
  tbr: number | null;
  height: number | null;
  abr: number | null;
};

export type Video = {
  title: string;
  duration: number;
  live_status: string;
  formats: Format[];
};

export const videoKey = "Video";
export const audioOnlyKey = "Audio Only";

export type MediaType = typeof videoKey | typeof audioOnlyKey;
