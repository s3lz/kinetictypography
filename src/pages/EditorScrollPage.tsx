import { useEffect, useRef, type RefObject } from "react";
import type { Screen } from "../App";
import { ExportingOverlay } from "../components/ExportingOverlay";
import { LandingHeroSection } from "../components/LandingHeroSection";
import type { TypographyCanvasHandle } from "../components/TypographyCanvas/types";
import { EditorPage } from "./EditorPage";
import type { CreativeState } from "../types/CreativeState";

interface EditorScrollPageProps {
  current: Screen;
  state: CreativeState;
  isPlaying: boolean;
  hasAudio: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  canvasRef: RefObject<TypographyCanvasHandle | null>;
  isExporting: boolean;
  exportProgress: number;
  onNavigate: (screen: Screen) => void;
  onChange: (patch: Partial<CreativeState>) => void;
  onTogglePlay: () => void;
  onExport: () => void;
}

export function EditorScrollPage({
  current,
  state,
  isPlaying,
  hasAudio,
  audioRef,
  canvasRef,
  isExporting,
  exportProgress,
  onNavigate,
  onChange,
  onTogglePlay,
  onExport,
}: EditorScrollPageProps) {
  const editorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    editorRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }, []);

  const scrollToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="home-page">
      <LandingHeroSection
        current={current}
        onNavigate={onNavigate}
        onCtaClick={scrollToEditor}
      />
      <section
        ref={editorRef}
        id="editor"
        className="scroll-section scroll-section--editor"
        aria-label="Editor"
      >
        <EditorPage
          state={state}
          isPlaying={isPlaying}
          hasAudio={hasAudio}
          audioRef={audioRef}
          canvasRef={canvasRef}
          onChange={onChange}
          onTogglePlay={onTogglePlay}
          onExport={onExport}
        />
      </section>
      {isExporting ? <ExportingOverlay progress={exportProgress} /> : null}
    </div>
  );
}
