export class ArrayBufferTarget {
  buffer: ArrayBuffer;
}

export class Muxer<T = ArrayBufferTarget> {
  target: T;
  constructor(options: {
    target: T;
    video?: {
      codec: "avc" | "hevc" | "vp9" | "av1";
      width: number;
      height: number;
      rotation?: 0 | 90 | 180 | 270;
      frameRate?: number;
    };
    fastStart?:
      | false
      | "in-memory"
      | "fragmented"
      | { expectedVideoChunks?: number; expectedAudioChunks?: number };
    firstTimestampBehavior?: "strict" | "offset" | "cross-track-offset";
  });
  addVideoChunk(
    chunk: EncodedVideoChunk,
    meta?: EncodedVideoChunkMetadata,
    timestamp?: number,
    compositionTimeOffset?: number
  ): void;
  finalize(): void;
}
