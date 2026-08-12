const CLEF_PATTERN_SCALE = "scale(0.00295858 0.00118343)";

interface ExportOverlayPatternProps {
  className?: string;
}

/** Figma export overlay background — five masked diagonal bass-clef panels */
export function ExportOverlayPattern({ className }: ExportOverlayPatternProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 840 605"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g opacity="0.15">
        <mask
          id="export-overlay-mask0"
          style={{ maskType: "luminance" }}
          maskUnits="userSpaceOnUse"
          x="-110"
          y="-101"
          width="542"
          height="717"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M-110 -16.4434L301.537 -101L431.482 531.444L19.9451 616L-110 -16.4434Z"
            fill="white"
          />
        </mask>
        <g mask="url(#export-overlay-mask0)">
          <g opacity="0.46">
            <rect
              x="-109.997"
              y="-16.4438"
              width="420.128"
              height="645.655"
              transform="rotate(-11.6107 -109.997 -16.4438)"
              fill="url(#export-overlay-pattern0)"
            />
          </g>
        </g>
      </g>
      <g opacity="0.15">
        <mask
          id="export-overlay-mask1"
          style={{ maskType: "luminance" }}
          maskUnits="userSpaceOnUse"
          x="249"
          y="46"
          width="542"
          height="717"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M790.482 130.557L378.945 46.0001L249 678.444L660.537 763L790.482 130.557Z"
            fill="white"
          />
        </mask>
        <g mask="url(#export-overlay-mask1)">
          <g opacity="0.46">
            <rect
              width="420.128"
              height="645.655"
              transform="matrix(-0.979538 -0.201261 -0.201261 0.979538 790.48 130.556)"
              fill="url(#export-overlay-pattern1)"
            />
          </g>
        </g>
      </g>
      <g opacity="0.15">
        <mask
          id="export-overlay-mask2"
          style={{ maskType: "luminance" }}
          maskUnits="userSpaceOnUse"
          x="195"
          y="-61"
          width="294"
          height="376"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M195 -14.6104L420.778 -60.9999L488.502 268.61L262.723 315L195 -14.6104Z"
            fill="white"
          />
        </mask>
        <g mask="url(#export-overlay-mask2)">
          <g opacity="0.46">
            <rect
              x="195.001"
              y="-14.6106"
              width="230.492"
              height="336.496"
              transform="rotate(-11.6107 195.001 -14.6106)"
              fill="url(#export-overlay-pattern2)"
            />
          </g>
        </g>
      </g>
      <g opacity="0.15">
        <mask
          id="export-overlay-mask3"
          style={{ maskType: "luminance" }}
          maskUnits="userSpaceOnUse"
          x="492"
          y="-318"
          width="495"
          height="621"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M986.151 -239.366L603.437 -318L492 224.366L874.714 303L986.151 -239.366Z"
            fill="white"
          />
        </mask>
        <g mask="url(#export-overlay-mask3)">
          <g opacity="0.46">
            <rect
              width="390.703"
              height="553.696"
              transform="matrix(-0.979538 -0.201261 -0.201261 0.979538 986.148 -239.366)"
              fill="url(#export-overlay-pattern3)"
            />
          </g>
        </g>
      </g>
      <g opacity="0.15">
        <mask
          id="export-overlay-mask4"
          style={{ maskType: "luminance" }}
          maskUnits="userSpaceOnUse"
          x="588"
          y="169"
          width="309"
          height="562"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M588 210.541L790.177 169L897 688.906L694.823 730.447L588 210.541Z"
            fill="white"
          />
        </mask>
        <g mask="url(#export-overlay-mask4)">
          <g opacity="0.46">
            <rect
              x="588.001"
              y="210.54"
              width="206.398"
              height="530.767"
              transform="rotate(-11.6107 588.001 210.54)"
              fill="url(#export-overlay-pattern4)"
            />
          </g>
        </g>
      </g>
      <defs>
        <image
          id="export-overlay-clef-tile"
          width="338"
          height="845"
          preserveAspectRatio="none"
          href="/assets/export-overlay-clef.png"
        />
        <pattern
          id="export-overlay-pattern0"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use href="#export-overlay-clef-tile" transform={CLEF_PATTERN_SCALE} />
        </pattern>
        <pattern
          id="export-overlay-pattern1"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use href="#export-overlay-clef-tile" transform={CLEF_PATTERN_SCALE} />
        </pattern>
        <pattern
          id="export-overlay-pattern2"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use href="#export-overlay-clef-tile" transform={CLEF_PATTERN_SCALE} />
        </pattern>
        <pattern
          id="export-overlay-pattern3"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use href="#export-overlay-clef-tile" transform={CLEF_PATTERN_SCALE} />
        </pattern>
        <pattern
          id="export-overlay-pattern4"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use href="#export-overlay-clef-tile" transform={CLEF_PATTERN_SCALE} />
        </pattern>
      </defs>
    </svg>
  );
}
