import { ArrayBufferTarget, Muxer } from "../vendor/mp4-muxer";
import { EXPORT_FPS, EXPORT_FRAME_DURATION_US } from "./constants";

export interface Mp4EncoderOptions {
  width: number;
  height: number;
}

export interface Mp4Encoder {
  encodeFrame: (source: CanvasImageSource, frameIndex: number) => Promise<void>;
  finalize: () => Promise<Blob>;
  close: () => void;
}

function pickAvcCodec(width: number, height: number): string {
  // Baseline@L3.1 for typical editor sizes; bump level for larger frames.
  const pixels = width * height;
  if (pixels > 1280 * 720) {
    return "avc1.4d0028"; // Main@L4.0
  }
  return "avc1.42001f"; // Baseline@L3.1
}

function assertWebCodecsSupport(): void {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") {
    throw new Error(
      "MP4 export requires WebCodecs (VideoEncoder). Try Chrome, Edge, or Safari 16.4+."
    );
  }
}

/**
 * Frame-perfect H.264 → MP4 encoder using WebCodecs + mp4-muxer.
 */
export async function createMp4Encoder(
  options: Mp4EncoderOptions
): Promise<Mp4Encoder> {
  assertWebCodecsSupport();

  const { width, height } = options;
  const codec = pickAvcCodec(width, height);

  const bitrate = Math.min(24_000_000, Math.max(8_000_000, width * height * 8));
  const baseConfig: VideoEncoderConfig = {
    codec,
    width,
    height,
    bitrate,
    framerate: EXPORT_FPS,
    latencyMode: "quality",
  };

  const support = await VideoEncoder.isConfigSupported(baseConfig);
  if (!support.supported) {
    throw new Error(
      `H.264 encoding is not supported at ${width}×${height} in this browser.`
    );
  }

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: "avc",
      width,
      height,
      frameRate: EXPORT_FPS,
    },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });

  let encodeError: Error | null = null;

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (error) => {
      encodeError = error instanceof Error ? error : new Error(String(error));
    },
  });

  encoder.configure(baseConfig);

  const encodeFrame = async (
    source: CanvasImageSource,
    frameIndex: number
  ): Promise<void> => {
    if (encodeError) throw encodeError;
    if (encoder.state === "closed") {
      throw new Error("Video encoder was closed unexpectedly.");
    }

    // Backpressure: don't flood the encoder.
    while (encoder.encodeQueueSize > 4) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      if (encodeError) throw encodeError;
    }

    const timestamp = frameIndex * EXPORT_FRAME_DURATION_US;
    const frame = new VideoFrame(source, {
      timestamp,
      duration: EXPORT_FRAME_DURATION_US,
    });

    try {
      encoder.encode(frame, { keyFrame: frameIndex % EXPORT_FPS === 0 });
    } finally {
      frame.close();
    }
  };

  const finalize = async (): Promise<Blob> => {
    if (encodeError) throw encodeError;
    await encoder.flush();
    if (encodeError) throw encodeError;
    muxer.finalize();
    return new Blob([new Uint8Array(target.buffer)], { type: "video/mp4" });
  };

  const close = () => {
    try {
      if (encoder.state !== "closed") {
        encoder.close();
      }
    } catch {
      // ignore
    }
  };

  return { encodeFrame, finalize, close };
}
