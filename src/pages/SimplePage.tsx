import type { Screen } from "../App";
import { AppNav } from "../components/AppNav";

interface SimplePageProps {
  title: string;
  body: string;
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

export function SimplePage({ title, body, current, onNavigate }: SimplePageProps) {
  return (
    <div className="page page--blue">
      <div className="page__inner">
        <AppNav current={current} onNavigate={onNavigate} />
        <section className="simple-page">
          <h1 className="simple-page__title script">{title}</h1>
          <p style={{ maxWidth: "40rem", fontSize: "1.25rem", lineHeight: 1.6 }}>
            {body}
          </p>
          <button
            type="button"
            className="btn-pill btn-pill--ghost"
            onClick={() => onNavigate("landing")}
          >
            back home
          </button>
        </section>
      </div>
    </div>
  );
}
