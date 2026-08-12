import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { getFontFamily } from "../../engine/fontSelector";
import type { CreativeState } from "../../types/CreativeState";
import { resolveTextColor } from "../../types/palette";
import { BackgroundLayer } from "../BackgroundLayer";
import { ZERO_AUDIO_ACCENT } from "../MotionEngine/audioAccent";
import { splitGlyphs } from "../MotionEngine/glyphUtils";
import {
  buildTextGroups,
  type TextGroup,
} from "../MotionEngine/motionGrammarOrchestrator";
import {
  applyCanvasFrame,
  clearElementMotion,
  type ViewportSize,
} from "./applyCanvasFrame";
import type { TypographyCanvasHandle } from "./types";

interface TypographyCanvasProps {
  state: CreativeState;
  audioRef?: RefObject<HTMLAudioElement | null>;
}

const MOTION_MARGIN = 10;
const MIN_FITTED_FONT_SIZE = 10;

function readFitBounds(viewport: HTMLElement): ViewportSize {
  const style = window.getComputedStyle(viewport);
  const padX =
    (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
  const padY =
    (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);

  return {
    width: Math.max(0, viewport.clientWidth - padX - MOTION_MARGIN * 2),
    height: Math.max(0, viewport.clientHeight - padY - MOTION_MARGIN * 2),
  };
}

function computeFittedFontSize(
  bounds: ViewportSize,
  content: HTMLDivElement,
  baseFontSize: number
): number {
  const { width: maxW, height: maxH } = bounds;

  if (maxW <= 0 || maxH <= 0) {
    return baseFontSize;
  }

  let size = baseFontSize;
  content.style.width = `${maxW}px`;
  content.style.maxWidth = `${maxW}px`;

  while (size >= MIN_FITTED_FONT_SIZE) {
    content.style.fontSize = `${size}px`;
    const { offsetHeight } = content;

    if (offsetHeight <= maxH) {
      return size;
    }

    size -= 1;
  }

  content.style.fontSize = `${MIN_FITTED_FONT_SIZE}px`;
  return MIN_FITTED_FONT_SIZE;
}

function resolveJustify(alignment: CreativeState["layout"]["alignment"]): string {
  if (alignment === "left") return "flex-start";
  if (alignment === "right") return "flex-end";
  return "center";
}

function resolveAlign(anchorY: number): string {
  if (anchorY < 0.38) return "flex-start";
  if (anchorY > 0.62) return "flex-end";
  return "center";
}

function wordsInLine(line: TextGroup, words: TextGroup[]): TextGroup[] {
  return words.filter(
    (word) => word.startIndex >= line.startIndex && word.endIndex <= line.endIndex
  );
}

/**
 * DOM motion hierarchy:
 *   stage (camera)
 *     line wrapper ← line layer (full transform)
 *       word wrapper ← word layer (full transform: translate/rotate/scale/skew)
 *         glyph span ← local variation + material + typography overlays
 */
export const TypographyCanvas = forwardRef<
  TypographyCanvasHandle,
  TypographyCanvasProps
>(function TypographyCanvas({ state, audioRef }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const stateRef = useRef(state);
  const viewportSizeRef = useRef<ViewportSize>({ width: 0, height: 0 });
  const rafRef = useRef<number>(0);
  const clockStartRef = useRef<number | null>(null);
  const clockOffsetRef = useRef(0);
  const isVisibleRef = useRef(true);
  const exportLockedRef = useRef(false);
  const [fittedFontSize, setFittedFontSize] = useState(state.fontSize);

  stateRef.current = state;

  const glyphs = splitGlyphs(state.text);
  const useKerning = state.kerning !== 0;
  const wordGroups = buildTextGroups(state.text, "word");
  const lineGroups = buildTextGroups(state.text, "line");

  const readViewportSize = (): ViewportSize => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return viewportSizeRef.current;
    }

    return readFitBounds(viewport);
  };

  const clearAllMotionStyles = () => {
    for (const element of charRefs.current) clearElementMotion(element);
    for (const element of wordRefs.current) clearElementMotion(element);
    for (const element of lineRefs.current) clearElementMotion(element);
  };

  const measureAndFit = () => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    clearAllMotionStyles();

    const fitBounds = readFitBounds(viewport);
    viewportSizeRef.current = fitBounds;

    const nextSize = computeFittedFontSize(
      fitBounds,
      content,
      stateRef.current.fontSize
    );

    setFittedFontSize((current) => (current === nextSize ? current : nextSize));
  };

  useImperativeHandle(
    ref,
    (): TypographyCanvasHandle => ({
      getCaptureRoot: () => containerRef.current,
      getPixelSize: () => {
        const root = containerRef.current;
        if (!root) return { width: 0, height: 0 };
        return {
          width: Math.max(0, Math.round(root.clientWidth)),
          height: Math.max(0, Math.round(root.clientHeight)),
        };
      },
      renderAtTime: (time, audioAccent = ZERO_AUDIO_ACCENT) => {
        applyCanvasFrame({
          time,
          state: stateRef.current,
          refs: {
            stage: stageRef.current,
            chars: charRefs.current,
            words: wordRefs.current,
            lines: lineRefs.current,
          },
          viewportSize: viewportSizeRef.current,
          audioAccent,
          clearAllMotionStyles,
        });
      },
      setExportLock: (locked) => {
        if (locked === exportLockedRef.current) return;

        if (locked) {
          // Freeze the live clock so preview resumes without a time jump.
          if (clockStartRef.current !== null) {
            clockOffsetRef.current +=
              (performance.now() - clockStartRef.current) / 1000;
            clockStartRef.current = null;
          }
          exportLockedRef.current = true;
        } else {
          exportLockedRef.current = false;
          clockStartRef.current = null;
        }
      },
      getState: () => stateRef.current,
    }),
    []
  );

  useLayoutEffect(() => {
    measureAndFit();
  }, [
    state.text,
    state.font,
    state.fontSize,
    state.fontWeight,
    state.tracking,
    state.kerning,
    state.layout.maxTextWidth,
    state.layout.lineHeight,
    state.layout.alignment,
    glyphs.length,
  ]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const container = containerRef.current;
    if (!viewport || !container) return;

    viewportSizeRef.current = readViewportSize();

    const resizeObserver = new ResizeObserver(() => {
      const nextViewport = readViewportSize();
      const unchanged =
        nextViewport.width === viewportSizeRef.current.width &&
        nextViewport.height === viewportSizeRef.current.height;

      if (unchanged) return;

      viewportSizeRef.current = nextViewport;
      measureAndFit();
    });
    resizeObserver.observe(viewport);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );

    intersectionObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const tick = (timestamp: number) => {
      if (exportLockedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!isVisibleRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (clockStartRef.current === null) {
        clockStartRef.current = timestamp;
      }

      const elapsed =
        clockOffsetRef.current + (timestamp - clockStartRef.current) / 1000;

      applyCanvasFrame({
        time: elapsed,
        state: stateRef.current,
        refs: {
          stage: stageRef.current,
          chars: charRefs.current,
          words: wordRefs.current,
          lines: lineRefs.current,
        },
        viewportSize: viewportSizeRef.current,
        audioRef,
        clearAllMotionStyles,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [audioRef]);

  charRefs.current.length = glyphs.length;
  wordRefs.current.length = wordGroups.length;
  lineRefs.current.length = lineGroups.length;

  const { layout, typography } = state;

  return (
    <div
      ref={containerRef}
      className="preview-canvas typography-canvas"
      style={{
        color: resolveTextColor(state.palette),
        position: "relative",
      }}
    >
      <BackgroundLayer
        background={state.background}
        aiColor={state.palette.background}
      />
      <div
        ref={viewportRef}
        className="typography-canvas__viewport"
        style={{
          justifyContent: resolveJustify(layout.alignment),
          alignItems: resolveAlign(layout.anchorY),
          padding: `${layout.marginY * 100}% ${layout.marginX * 100}%`,
        }}
      >
        <div ref={stageRef} className="typography-canvas__stage">
          <div
            ref={contentRef}
            className="typography-canvas__content"
            style={{
              fontFamily: getFontFamily(state.font),
              fontWeight: state.fontWeight,
              fontSize: `${fittedFontSize}px`,
              letterSpacing: `${state.tracking}px`,
              lineHeight: typography.lineHeight,
              textAlign: layout.alignment,
              maxWidth: `${layout.maxTextWidth * 100}%`,
              fontKerning: "none",
            }}
          >
            {lineGroups.map((line) => {
              const lineWords = wordsInLine(line, wordGroups);
              return (
                <span
                  key={`line-${line.groupIndex}`}
                  ref={(element) => {
                    lineRefs.current[line.groupIndex] = element;
                  }}
                  className="typography-canvas__group typography-canvas__group--line"
                >
                  {lineWords.map((word) => {
                    const groupGlyphs = glyphs.slice(word.startIndex, word.endIndex);
                    const isSpaceGroup =
                      groupGlyphs.length === 1 && groupGlyphs[0] === " ";

                    return (
                      <span
                        key={`word-${word.groupIndex}`}
                        ref={(element) => {
                          wordRefs.current[word.groupIndex] = element;
                        }}
                        className={
                          isSpaceGroup
                            ? "typography-canvas__group typography-canvas__group--word typography-canvas__group--space"
                            : "typography-canvas__group typography-canvas__group--word"
                        }
                      >
                        {groupGlyphs.map((glyph, offset) => {
                          const index = word.startIndex + offset;
                          return (
                            <span
                              key={`${index}-${glyph}`}
                              ref={(element) => {
                                charRefs.current[index] = element;
                              }}
                              className={
                                glyph === " "
                                  ? "typography-canvas__glyph typography-canvas__glyph--space"
                                  : "typography-canvas__glyph"
                              }
                              aria-hidden={glyph === " " ? true : undefined}
                              style={
                                useKerning && index < glyphs.length - 1
                                  ? { marginRight: `${state.kerning}px` }
                                  : undefined
                              }
                            >
                              {glyph}
                            </span>
                          );
                        })}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
