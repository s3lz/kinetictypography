const CLEF_PATTERN_SCALE = "scale(0.00367647 0.00318471)";

interface GeneratingHeartSvgProps {
  className?: string;
}

/** Figma node 167:89 — mirrored bass clef heart */
export function GeneratingHeartSvg({ className }: GeneratingHeartSvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 1512 873"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g opacity="0.4">
        <rect
          width="683.778"
          height="761.45"
          transform="matrix(-1 0 0 1 762.389 55.775)"
          fill="url(#gen-heart-p0)"
        />
      </g>
      <g opacity="0.4">
        <rect
          x="728.611"
          y="55.775"
          width="683.778"
          height="761.45"
          fill="url(#gen-heart-p1)"
        />
      </g>
      <defs>
        <image
          id="gen-heart-clef-tile"
          width="272"
          height="314"
          preserveAspectRatio="none"
          href="/assets/generating-bass-clef.png"
        />
        <pattern
          id="gen-heart-p0"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use href="#gen-heart-clef-tile" transform={CLEF_PATTERN_SCALE} />
        </pattern>
        <pattern
          id="gen-heart-p1"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use href="#gen-heart-clef-tile" transform={CLEF_PATTERN_SCALE} />
        </pattern>
      </defs>
    </svg>
  );
}
