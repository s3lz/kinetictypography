import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { TypographyCanvasHandle } from "./components/TypographyCanvas/types";
import { exportTypographyVideo } from "./export";
import { ContactPage } from "./pages/ContactPage";
import { EditorScrollPage } from "./pages/EditorScrollPage";
import { GeneratingPage } from "./pages/GeneratingPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { LandingPage } from "./pages/LandingPage";
import { runAudioGeneration } from "./services/runAudioGeneration";
import {
  defaultCreativeState,
  normalizeMotionLevels,
  type CreativeState,
} from "./types/CreativeState";

export type Screen =
  | "landing"
  | "generating"
  | "editor"
  | "how-it-works"
  | "contact";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [creativeState, setCreativeState] =
    useState<CreativeState>(defaultCreativeState);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<TypographyCanvasHandle | null>(null);
  const exportInFlightRef = useRef(false);

  const pendingUploadTextRef = useRef<string | null>(null);
  const pendingUploadFileRef = useRef<File | null>(null);

  const handleCreativeChange = useCallback((patch: Partial<CreativeState>) => {
    setCreativeState((current) => ({
      ...current,
      ...patch,
      ...(patch.motion ? { motion: normalizeMotionLevels(patch.motion) } : {}),
    }));
  }, []);

  const beginGenerationWithFile = useCallback((file: File) => {
    pendingUploadFileRef.current = file;
    setAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setIsPlaying(false);
    pendingUploadTextRef.current =
      file.name.replace(/\.[^.]+$/, "").slice(0, 80) || null;
    setScreen("generating");
  }, []);

  useEffect(() => {
    if (screen !== "generating") return;

    let cancelled = false;

    const runGeneration = async () => {
      const uploadedFile = pendingUploadFileRef.current;
      if (!uploadedFile) {
        throw new Error("Missing audio file for generation");
      }

      const generatedState = await runAudioGeneration(uploadedFile);

      if (cancelled) return;

      const uploadText = pendingUploadTextRef.current;

      setCreativeState({
        ...generatedState,
        text: uploadText || generatedState.text,
      });
      pendingUploadTextRef.current = null;
      pendingUploadFileRef.current = null;
      setScreen("editor");
    };

    void runGeneration().catch((error) => {
      if (cancelled) return;

      console.error("[Generation] Pipeline failed", error);

      const message =
        error instanceof Error ? error.message : "Generation failed unexpectedly";

      window.alert(`Generation failed:\n\n${message}`);

      pendingUploadTextRef.current = null;
      pendingUploadFileRef.current = null;
      setScreen("landing");
    });

    return () => {
      cancelled = true;
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== "editor" || !audioUrl) return;

    const audio = audioRef.current;
    if (!audio) return;

    void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [screen, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncPlaying = () => setIsPlaying(!audio.paused);
    audio.addEventListener("play", syncPlaying);
    audio.addEventListener("pause", syncPlaying);
    audio.addEventListener("ended", syncPlaying);

    return () => {
      audio.removeEventListener("play", syncPlaying);
      audio.removeEventListener("pause", syncPlaying);
      audio.removeEventListener("ended", syncPlaying);
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (exportInFlightRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas?.getCaptureRoot()) {
      window.alert("Preview is still loading. Try export again in a moment.");
      return;
    }

    exportInFlightRef.current = true;
    setExportProgress(0);
    setIsExporting(true);

    const audio = audioRef.current;
    const wasPlaying = Boolean(audio && !audio.paused);
    if (audio && wasPlaying) {
      audio.pause();
    }

    try {
      await exportTypographyVideo({
        canvas,
        onProgress: setExportProgress,
        autoDownload: true,
      });
    } catch (error) {
      console.error("[Export] MP4 export failed", error);
      const message =
        error instanceof Error ? error.message : "Export failed unexpectedly";
      window.alert(`Export failed:\n\n${message}`);
    } finally {
      if (audio && wasPlaying) {
        void audio.play().catch(() => undefined);
      }
      exportInFlightRef.current = false;
      setIsExporting(false);
      setExportProgress(0);
    }
  }, []);

  let page: ReactNode;

  if (screen === "landing") {
    page = (
      <LandingPage
        current={screen}
        onNavigate={setScreen}
        onUpload={beginGenerationWithFile}
      />
    );
  } else if (screen === "generating") {
    page = <GeneratingPage />;
  } else if (screen === "editor") {
    page = (
      <EditorScrollPage
        current={screen}
        state={creativeState}
        isPlaying={isPlaying}
        hasAudio={Boolean(audioUrl)}
        audioRef={audioRef}
        canvasRef={canvasRef}
        isExporting={isExporting}
        exportProgress={exportProgress}
        onNavigate={setScreen}
        onChange={handleCreativeChange}
        onTogglePlay={handleTogglePlay}
        onExport={() => {
          void handleExport();
        }}
      />
    );
  } else if (screen === "how-it-works") {
    page = (
      <HowItWorksPage current={screen} onNavigate={setScreen} />
    );
  } else {
    page = <ContactPage current={screen} onNavigate={setScreen} />;
  }

  return (
    <>
      {audioUrl ? (
        <audio ref={audioRef} src={audioUrl} preload="auto" />
      ) : null}
      {page}
    </>
  );
}
