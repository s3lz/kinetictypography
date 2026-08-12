import { getAudioAnalyser } from "@/audio/audioGraph";

export interface AudioAccent {
  beat: number;
  energy: number;
  transient: number;
}

export const ZERO_AUDIO_ACCENT: AudioAccent = {
  beat: 0,
  energy: 0,
  transient: 0,
};

/** Attack / release for audio → transform signals (higher = snappier). */
export const AUDIO_ACCENT_SMOOTHING = {
  attack: 0.22,
  release: 0.12,
} as const;

interface AccentSamplerState {
  data: Uint8Array;
  previousEnergy: number;
  previousLowBand: number;
  lastBeatTime: number;
  smoothedBeat: number;
  smoothedEnergy: number;
  smoothedTransient: number;
}

const samplerState = new WeakMap<AnalyserNode, AccentSamplerState>();

function average(data: Uint8Array): number {
  if (data.length === 0) return 0;
  let sum = 0;
  for (let index = 0; index < data.length; index += 1) {
    sum += data[index];
  }
  return sum / data.length / 255;
}

function lowBandAverage(data: Uint8Array): number {
  const end = Math.max(1, Math.floor(data.length * 0.18));
  let sum = 0;
  for (let index = 0; index < end; index += 1) {
    sum += data[index];
  }
  return sum / end / 255;
}

function smoothToward(
  current: number,
  target: number,
  attack: number,
  release: number
): number {
  const rate = target > current ? attack : release;
  return current + (target - current) * rate;
}

export function sampleAudioAccent(
  audio: HTMLAudioElement | null,
  time: number
): AudioAccent {
  if (!audio || audio.paused || audio.ended) {
    return ZERO_AUDIO_ACCENT;
  }

  try {
    const analyser = getAudioAnalyser(audio);
    let state = samplerState.get(analyser);

    if (!state) {
      state = {
        data: new Uint8Array(analyser.frequencyBinCount),
        previousEnergy: 0,
        previousLowBand: 0,
        lastBeatTime: -Infinity,
        smoothedBeat: 0,
        smoothedEnergy: 0,
        smoothedTransient: 0,
      };
      samplerState.set(analyser, state);
    }

    analyser.getByteFrequencyData(state.data);

    const energy = average(state.data);
    const lowBand = lowBandAverage(state.data);
    const transient = Math.max(0, energy - state.previousEnergy * 0.9);
    const lowTransient = Math.max(0, lowBand - state.previousLowBand * 0.88);

    let beat = 0;
    const beatCandidate = Math.max(transient, lowTransient * 1.15);
    if (beatCandidate > 0.08 && time - state.lastBeatTime > 0.12) {
      beat = Math.min(1, beatCandidate * 2.4);
      state.lastBeatTime = time;
    }

    state.previousEnergy = energy;
    state.previousLowBand = lowBand;

    const { attack, release } = AUDIO_ACCENT_SMOOTHING;
    state.smoothedBeat = smoothToward(state.smoothedBeat, beat, attack, release);
    state.smoothedEnergy = smoothToward(state.smoothedEnergy, energy, attack, release);
    state.smoothedTransient = smoothToward(
      state.smoothedTransient,
      Math.min(1, transient * 2.2),
      attack,
      release
    );

    return {
      beat: state.smoothedBeat,
      energy: state.smoothedEnergy,
      transient: state.smoothedTransient,
    };
  } catch {
    return ZERO_AUDIO_ACCENT;
  }
}
