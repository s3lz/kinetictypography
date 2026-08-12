import type { ReactNode } from "react";
import { GeneratingAccentsSvg } from "./GeneratingAccentsSvg";
import { GeneratingHeartSvg } from "./GeneratingHeartSvg";

interface GeneratingBackgroundProps {
  children?: ReactNode;
}

/** Generating screen — accents (52:42) + heart (167:89) + label slot */
export function GeneratingBackground({ children }: GeneratingBackgroundProps) {
  return (
    <div className="generating-bg">
      <GeneratingAccentsSvg className="generating-bg__accents" />
      <div className="generating-bg__frame">
        <GeneratingHeartSvg className="generating-bg__heart" />
      </div>
      {children ? <div className="generating-bg__label">{children}</div> : null}
    </div>
  );
}
