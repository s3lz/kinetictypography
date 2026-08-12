import type { Screen } from "../App";
import { AppNav } from "../components/AppNav";

interface ContactPageProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

export function ContactPage({ current, onNavigate }: ContactPageProps) {
  return (
    <div className="page page--info page--contact">
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

        <section className="info-page__content contact__content" aria-label="Contact">
          <p className="contact__message">
            let me know your thoughts, the project can always evolve further!
          </p>
          <a className="contact__email" href="mailto:selzheng@gmail.com">
            email: selzheng@gmail.com
          </a>
        </section>
      </div>
    </div>
  );
}
