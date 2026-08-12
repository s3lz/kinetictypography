import { useEffect, useState } from "react";
import { GeneratingBackground } from "../components/GeneratingBackground";

const DOT_CYCLE_MS = 600;

export function GeneratingPage() {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDotCount((count) => (count % 3) + 1);
    }, DOT_CYCLE_MS);
    return () => window.clearInterval(id);
  }, []);

  const dots = Array.from({ length: dotCount }, () => ".").join(" ");

  return (
    <div className="page page--cream page--generating">
      <GeneratingBackground>
        <h1 className="generating-stage__title" aria-live="polite">
          Generating{" "}
          <span className="generating-stage__dots">{dots}</span>
        </h1>
      </GeneratingBackground>
    </div>
  );
}
