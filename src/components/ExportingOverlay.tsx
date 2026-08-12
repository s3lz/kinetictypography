import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ExportOverlayPattern } from "./ExportOverlayPattern";
import { LoadingBar } from "./LoadingBar";

interface ExportingOverlayProps {
  /** 0–100, driven by the real export pipeline. */
  progress: number;
}

export function ExportingOverlay({ progress }: ExportingOverlayProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div className="export-overlay" role="dialog" aria-modal="true" aria-label="Exporting">
      <div className="export-overlay__card">
        <div className="export-overlay__pattern" aria-hidden="true">
          <ExportOverlayPattern className="export-overlay__pattern-art" />
        </div>
        <div className="export-overlay__content">
          <h1 className="export-overlay__title">Exporting</h1>
          <LoadingBar progress={progress} className="export-overlay__bar" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
