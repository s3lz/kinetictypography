const CLEF_PATTERN_SCALE = "scale(0.00367647 0.00318471)";

function ClefPattern({ id }: { id: string }) {
  return (
    <pattern
      id={id}
      patternContentUnits="objectBoundingBox"
      width="1"
      height="1"
    >
      <use href="#generating-clef-tile" transform={CLEF_PATTERN_SCALE} />
    </pattern>
  );
}

interface GeneratingAccentsSvgProps {
  className?: string;
}

/** Figma node 52:42 — corner clefs; frame maps 1:1 to the viewport edges */
export function GeneratingAccentsSvg({ className }: GeneratingAccentsSvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 1512 982"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect opacity="0.3" y="612" width="343" height="370" fill="url(#gen-accent-p0)" />
      <rect
        opacity="0.3"
        x="306.229"
        y="-144"
        width="250.195"
        height="370"
        transform="rotate(62.8492 306.229 -144)"
        fill="url(#gen-accent-p1)"
      />
      <rect
        opacity="0.3"
        x="750.385"
        y="177.289"
        width="250.195"
        height="370"
        transform="rotate(-134.829 750.385 177.289)"
        fill="url(#gen-accent-p2)"
      />
      <rect
        opacity="0.3"
        width="250.195"
        height="370"
        transform="matrix(-0.456334 0.889809 0.889809 0.456334 1185.17 -144)"
        fill="url(#gen-accent-p3)"
      />
      <rect
        opacity="0.3"
        width="343"
        height="370"
        transform="matrix(-1 0 0 1 1523 612)"
        fill="url(#gen-accent-p4)"
      />
      <rect
        opacity="0.3"
        x="343.333"
        y="1153.38"
        width="272"
        height="379.073"
        transform="rotate(-135 343.333 1153.38)"
        fill="url(#gen-accent-p5)"
      />
      <rect
        opacity="0.3"
        width="272"
        height="379.073"
        transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 1167.04 1153.38)"
        fill="url(#gen-accent-p6)"
      />
      <rect
        opacity="0.3"
        x="614"
        y="1229"
        width="315"
        height="427"
        transform="rotate(-90 614 1229)"
        fill="url(#gen-accent-p7)"
      />
      <defs>
        <image
          id="generating-clef-tile"
          width="272"
          height="314"
          preserveAspectRatio="none"
          href="/assets/generating-bass-clef.png"
        />
        <ClefPattern id="gen-accent-p0" />
        <ClefPattern id="gen-accent-p1" />
        <ClefPattern id="gen-accent-p2" />
        <ClefPattern id="gen-accent-p3" />
        <ClefPattern id="gen-accent-p4" />
        <ClefPattern id="gen-accent-p5" />
        <ClefPattern id="gen-accent-p6" />
        <ClefPattern id="gen-accent-p7" />
      </defs>
    </svg>
  );
}
