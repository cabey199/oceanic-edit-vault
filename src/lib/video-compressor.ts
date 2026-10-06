import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const FFMPEG_CORE_VERSION = "0.12.10";

export type CompressionProgress = {
  phase: "loading" | "compressing" | "finalizing";
  progress: number;
};

export type CompressionResult = {
  blob: Blob;
  fileName: string;
  inputBytes: number;
  outputBytes: number;
  savedPercent: number;
  width: number;
  height: number;
  duration: number;
};

let ffmpegPromise: Promise<FFmpeg> | undefined;
let activeFFmpeg: FFmpeg | undefined;

function readVideoMetadata(
  source: File | Blob,
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(source);
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const metadata = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      };
      cleanup();
      if (!metadata.width || !metadata.height || !Number.isFinite(metadata.duration)) {
        reject(new Error("Video metadata could not be read."));
        return;
      }
      resolve(metadata);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Video metadata could not be read."));
    };
    video.src = objectUrl;
  });
}

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = new FFmpeg();
      activeFFmpeg = ffmpeg;
      const base = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;
      await ffmpeg.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

export function cancelCompression() {
  activeFFmpeg?.terminate();
  activeFFmpeg = undefined;
  ffmpegPromise = undefined;
}

export async function compressVideo(
  file: File,
  onProgress?: (progress: CompressionProgress) => void,
): Promise<CompressionResult> {
  const sourceMetadata = await readVideoMetadata(file);
  const ffmpeg = await getFFmpeg();
  onProgress?.({ phase: "compressing", progress: 0.08 });

  const inputName = `input-${Date.now()}.${file.name.split(".").pop() || "mp4"}`;
  const outputName = `playback-${Date.now()}.mp4`;
  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.({ phase: "compressing", progress: Math.min(0.94, 0.08 + progress * 0.86) });
  });

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i",
    inputName,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    outputName,
  ]);

  onProgress?.({ phase: "finalizing", progress: 0.97 });
  const outputData = await ffmpeg.readFile(outputName);
  const outputBytes = new Uint8Array(outputData as Uint8Array);
  const blob = new Blob([outputBytes], { type: "video/mp4" });
  const outputMetadata = await readVideoMetadata(blob);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  onProgress?.({ phase: "finalizing", progress: 1 });

  if (
    outputMetadata.width !== sourceMetadata.width ||
    outputMetadata.height !== sourceMetadata.height
  ) {
    throw new Error(
      `Playback compression changed the resolution from ${sourceMetadata.width}×${sourceMetadata.height} to ${outputMetadata.width}×${outputMetadata.height}.`,
    );
  }

  const durationTolerance = Math.max(0.25, sourceMetadata.duration * 0.01);
  if (Math.abs(outputMetadata.duration - sourceMetadata.duration) > durationTolerance) {
    throw new Error(
      `Playback compression changed the duration from ${sourceMetadata.duration.toFixed(2)}s to ${outputMetadata.duration.toFixed(2)}s.`,
    );
  }

  return {
    blob,
    fileName: `${file.name.replace(/\.[^/.]+$/, "")}.playback.mp4`,
    inputBytes: file.size,
    outputBytes: blob.size,
    savedPercent: file.size === 0 ? 0 : Math.max(0, Math.round((1 - blob.size / file.size) * 100)),
    width: sourceMetadata.width,
    height: sourceMetadata.height,
    duration: sourceMetadata.duration,
  };
}
