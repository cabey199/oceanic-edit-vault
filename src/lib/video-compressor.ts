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
};

let ffmpegPromise: Promise<FFmpeg> | undefined;
let activeFFmpeg: FFmpeg | undefined;

function readVideoDimensions(source: File | Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(source);
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const dimensions = { width: video.videoWidth, height: video.videoHeight };
      cleanup();
      if (!dimensions.width || !dimensions.height) {
        reject(new Error("Video dimensions could not be read."));
        return;
      }
      resolve(dimensions);
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
  const sourceDimensions = await readVideoDimensions(file);
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
  const outputDimensions = await readVideoDimensions(blob);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  onProgress?.({ phase: "finalizing", progress: 1 });

  if (
    outputDimensions.width !== sourceDimensions.width ||
    outputDimensions.height !== sourceDimensions.height
  ) {
    throw new Error(
      `Playback compression changed the resolution from ${sourceDimensions.width}×${sourceDimensions.height} to ${outputDimensions.width}×${outputDimensions.height}.`,
    );
  }

  return {
    blob,
    fileName: `${file.name.replace(/\.[^/.]+$/, "")}.playback.mp4`,
    inputBytes: file.size,
    outputBytes: blob.size,
    savedPercent: file.size === 0 ? 0 : Math.max(0, Math.round((1 - blob.size / file.size) * 100)),
    width: sourceDimensions.width,
    height: sourceDimensions.height,
  };
}
