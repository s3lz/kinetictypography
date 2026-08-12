import { useEffect, useRef, useState, type RefObject } from "react";
import { getAudioAnalyser, resumeAudioContext } from "./audioGraph";

export const IDLE_CENTER_BARS = [58, 62, 68, 72, 72, 68, 62, 58];
export const IDLE_LEFT_BARS = [...IDLE_CENTER_BARS].reverse();
export const IDLE_RIGHT_BARS = IDLE_CENTER_BARS;

const MIN_BAR_HEIGHT = 24;
const MAX_BAR_HEIGHT = 95;
const BAR_COUNT = 8;
const LERP_FACTOR = 0.22;

function lerp(current: number, target: number, factor: number) {
  return current + (target - current) * factor;
}

function lerpBars(current: number[], target: number[], factor: number) {
  return current.map((height, index) =>
    lerp(height, target[index] ?? MIN_BAR_HEIGHT, factor),
  );
}

function averageBins(data: Uint8Array, startBin: number, endBin: number) {
  let sum = 0;
  const count = Math.max(1, endBin - startBin);

  for (let index = startBin; index < endBin; index += 1) {
    sum += data[index] ?? 0;
  }

  return sum / count;
}

function getBarHeight(data: Uint8Array, barIndex: number, totalBars: number) {
  const startBin = Math.floor((barIndex / totalBars) ** 1.35 * data.length);
  const endBin = Math.max(
    startBin + 1,
    Math.floor(((barIndex + 1) / totalBars) ** 1.35 * data.length),
  );
  const average = averageBins(data, startBin, endBin);

  return Math.max(
    MIN_BAR_HEIGHT,
    MIN_BAR_HEIGHT + (average / 255) * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT),
  );
}

function getFrequencyHeights(data: Uint8Array) {
  const centerBars = Array.from({ length: BAR_COUNT }, (_, index) =>
    getBarHeight(data, index, BAR_COUNT),
  );

  return {
    left: [...centerBars].reverse(),
    right: centerBars,
  };
}

export function useAudioVisualizer(
  audioRef: RefObject<HTMLAudioElement | null>,
  isPlaying: boolean,
  hasAudio: boolean,
) {
  const [leftHeights, setLeftHeights] = useState(IDLE_LEFT_BARS);
  const [rightHeights, setRightHeights] = useState(IDLE_RIGHT_BARS);
  const leftCurrentRef = useRef([...IDLE_LEFT_BARS]);
  const rightCurrentRef = useRef([...IDLE_RIGHT_BARS]);
  const dataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasAudio || !isPlaying) {
      leftCurrentRef.current = [...IDLE_LEFT_BARS];
      rightCurrentRef.current = [...IDLE_RIGHT_BARS];
      setLeftHeights(IDLE_LEFT_BARS);
      setRightHeights(IDLE_RIGHT_BARS);
      return;
    }

    let cancelled = false;
    let analyser: AnalyserNode | null = null;
    let audio: HTMLAudioElement | null = null;

    const tick = () => {
      if (cancelled) return;

      if (!audio || !analyser) {
        audio = audioRef.current;
        if (!audio) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        analyser = getAudioAnalyser(audio);
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
        void resumeAudioContext(audio);
      }

      if (audio.paused || audio.ended) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const data = dataRef.current;
      if (!data) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      analyser.getByteFrequencyData(data);
      const { left, right } = getFrequencyHeights(data);

      leftCurrentRef.current = lerpBars(
        leftCurrentRef.current,
        left,
        LERP_FACTOR,
      );
      rightCurrentRef.current = lerpBars(
        rightCurrentRef.current,
        right,
        LERP_FACTOR,
      );

      setLeftHeights([...leftCurrentRef.current]);
      setRightHeights([...rightCurrentRef.current]);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [audioRef, hasAudio, isPlaying]);

  return { leftHeights, rightHeights };
}
