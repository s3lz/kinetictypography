import type { RefObject } from "react";
import { useAudioVisualizer } from "../audio/useAudioVisualizer";

interface PlaybackWaveformProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  hasAudio: boolean;
  onTogglePlay: () => void;
}

function barHeightStyle(percent: number) {
  return { height: `calc(${percent / 100} * clamp(2.1rem, 3.8vw, 3.25rem))` };
}

export function PlaybackWaveform({
  audioRef,
  isPlaying,
  hasAudio,
  onTogglePlay,
}: PlaybackWaveformProps) {
  const { leftHeights, rightHeights } = useAudioVisualizer(
    audioRef,
    isPlaying,
    hasAudio,
  );

  return (
    <div className="playback">
      <div className="waveform" aria-hidden="true">
        {leftHeights.map((height, index) => (
          <span
            key={`l-${index}`}
            className="waveform__bar"
            style={barHeightStyle(height)}
          />
        ))}
      </div>
      <button
        type="button"
        className="play-btn"
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <span className="play-btn__pause" aria-hidden="true">
            <span />
            <span />
          </span>
        ) : (
          <span className="play-btn__play" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 6v12l12-6L8 6z" />
            </svg>
          </span>
        )}
      </button>
      <div className="waveform" aria-hidden="true">
        {rightHeights.map((height, index) => (
          <span
            key={`r-${index}`}
            className="waveform__bar"
            style={barHeightStyle(height)}
          />
        ))}
      </div>
    </div>
  );
}
