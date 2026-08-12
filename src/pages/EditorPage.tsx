import type { RefObject } from "react";
import { EditorControls } from "../components/EditorControls";
import { PlaybackWaveform } from "../components/PlaybackWaveform";
import { TypographyCanvas } from "../components/TypographyCanvas";
import type { TypographyCanvasHandle } from "../components/TypographyCanvas/types";
import type { CreativeState } from "../types/CreativeState";

interface EditorPageProps {
  state: CreativeState;
  isPlaying: boolean;
  hasAudio: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  canvasRef: RefObject<TypographyCanvasHandle | null>;
  onChange: (patch: Partial<CreativeState>) => void;
  onTogglePlay: () => void;
  onExport: () => void;
}

export function EditorPage({
  state,
  isPlaying,
  hasAudio,
  audioRef,
  canvasRef,
  onChange,
  onTogglePlay,
  onExport,
}: EditorPageProps) {
  return (
    <div className="page page--cream page--editor">
      <div className="editor-card">
        <header className="editor-header">
          <h1 className="editor-header__title">Editor Mode</h1>
          <PlaybackWaveform
            audioRef={audioRef}
            isPlaying={isPlaying}
            hasAudio={hasAudio}
            onTogglePlay={onTogglePlay}
          />
          <button
            type="button"
            className="editor-header__export"
            onClick={onExport}
          >
            ⋆｡+♫ export video ♫
          </button>
        </header>

        <div className="editor-body">
          <TypographyCanvas ref={canvasRef} state={state} audioRef={audioRef} />
          <EditorControls state={state} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
