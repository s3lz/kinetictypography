import type { Screen } from "../App";

interface AppNavProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

export function AppNav({ current, onNavigate }: AppNavProps) {
  return (
    <nav className="nav" aria-label="Main">
      <button
        type="button"
        className="nav__link"
        onClick={() => onNavigate("how-it-works")}
        aria-current={current === "how-it-works" ? "page" : undefined}
      >
        how it works
      </button>
      <button
        type="button"
        className="nav__link"
        onClick={() => onNavigate("contact")}
        aria-current={current === "contact" ? "page" : undefined}
      >
        contact
      </button>
    </nav>
  );
}
