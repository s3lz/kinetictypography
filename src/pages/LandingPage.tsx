import { useRef } from "react";
import type { Screen } from "../App";
import { LandingHeroSection } from "../components/LandingHeroSection";
import { UploadSection } from "../components/UploadSection";

interface LandingPageProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
  onUpload: (file: File) => void;
}

export function LandingPage({ current, onNavigate, onUpload }: LandingPageProps) {
  const uploadRef = useRef<HTMLElement>(null);

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="home-page">
      <LandingHeroSection
        current={current}
        onNavigate={onNavigate}
        onCtaClick={scrollToUpload}
      />

      <section
        ref={uploadRef}
        id="upload"
        className="scroll-section scroll-section--upload"
        aria-label="Upload"
      >
        <div className="page__inner">
          <UploadSection onUpload={onUpload} />
        </div>
      </section>
    </div>
  );
}
