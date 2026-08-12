import type { Ref } from "react";
import type { Screen } from "../App";
import { AppNav } from "./AppNav";
import { LandingMusicBackground } from "./LandingMusicBackground";

interface LandingHeroSectionProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
  onCtaClick: () => void;
  sectionRef?: Ref<HTMLElement>;
}

export function LandingHeroSection({
  current,
  onNavigate,
  onCtaClick,
  sectionRef,
}: LandingHeroSectionProps) {
  return (
    <section
      ref={sectionRef}
      id="landing"
      className="scroll-section scroll-section--landing"
      aria-label="Home"
    >
      <LandingMusicBackground />
      <div className="page__inner landing-layout">
        <AppNav current={current} onNavigate={onNavigate} />
        <div className="landing-hero__title-wrap">
          <img
            className="landing-hero__title"
            src="/assets/kinetic-typography-title.svg"
            alt="Kinetic Typography"
          />
          <p className="landing-hero__tagline">
            generate motion typography through audio
          </p>
        </div>
        <button type="button" className="landing-hero__cta" onClick={onCtaClick}>
          start by uploading an audio
        </button>
      </div>
    </section>
  );
}
