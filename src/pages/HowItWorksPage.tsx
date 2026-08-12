import type { Screen } from "../App";
import { AppNav } from "../components/AppNav";

interface HowItWorksPageProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

export function HowItWorksPage({ current, onNavigate }: HowItWorksPageProps) {
  return (
    <div className="page page--info page--how-it-works">
      <div className="info-page-bg" aria-hidden="true" />
      <div className="page__inner info-page-layout">
        <header className="info-page__header">
          <button
            type="button"
            className="info-page__brand"
            onClick={() => onNavigate("landing")}
          >
            Kinetic Typography
          </button>
          <AppNav current={current} onNavigate={onNavigate} />
        </header>

        <section className="info-page__content how-it-works__content" aria-label="How it works">
          <p className="how-it-works__intro">
            I am curious to how AI is able to interpret various songs, and how
            different prompting affects the results of AI interpretation. As
            someone who loves audio and visual art, I wanted to also see how AI
            would interpret my own music. Try it out yourself!
          </p>
          <p className="how-it-works__body">
            Upload an audio, and the audio will be ran through an LLM model to
            extract the core details. AI will then interpret what it thinks how
            the typography should look. However, you ultimately get the final
            say in how you feel the kinetic typography should look like. After
            you’re done you can export the typography as a video.
          </p>
        </section>
      </div>
    </div>
  );
}
