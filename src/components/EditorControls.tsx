import { useEffect, useState, type CSSProperties } from "react";
import { FONT_CATALOG } from "../engine/fontSelector";
import {
  MOTION_DIMENSION_DESCRIPTIONS,
  MOTION_DIMENSION_LABELS,
  MOTION_DIMENSIONS,
  type CreativeState,
  type MotionDimension,
} from "../types/CreativeState";
import { createUploadedImageBackground } from "../types/background";
import { BackgroundImageSwatch, PaletteSwatch } from "./ColorPicker";
import { resolveTextColor } from "../types/palette";

interface MetricNumberInputProps {
  value: number;
  onChange: (value: number) => void;
}

function MetricNumberInput({ value, onChange }: MetricNumberInputProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <input
      className="control-input control-input--metric"
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={(event) => {
        const next = event.target.value;
        if (next === "" || next === "-" || next === "." || next === "-.") {
          setDraft(next);
          return;
        }
        if (/^-?\d*\.?\d*$/.test(next)) {
          setDraft(next);
          const parsed = Number(next);
          if (!Number.isNaN(parsed)) {
            onChange(parsed);
          }
        }
      }}
      onBlur={() => {
        const parsed = Number(draft);
        if (draft === "" || draft === "-" || draft === "." || Number.isNaN(parsed)) {
          onChange(0);
          setDraft("0");
          return;
        }
        onChange(parsed);
        setDraft(String(parsed));
      }}
    />
  );
}

interface EditorControlsProps {
  state: CreativeState;
  onChange: (patch: Partial<CreativeState>) => void;
}

const FONT_SIZE_PRESETS = [24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 128];
const FONT_WEIGHT_PRESETS = [300, 400, 500, 600, 700] as const;

const FONT_WEIGHT_LABELS: Record<number, string> = {
  300: "light",
  400: "regular",
  500: "medium",
  600: "semibold",
  700: "bold",
};

function fontSizeOptions(current: number): number[] {
  const sizes = new Set(FONT_SIZE_PRESETS);
  if (Number.isFinite(current) && current > 0) {
    sizes.add(Math.round(current));
  }
  return [...sizes].sort((a, b) => a - b);
}

function fontWeightOptions(current: number): number[] {
  const weights = new Set<number>(FONT_WEIGHT_PRESETS);
  if (Number.isFinite(current) && current > 0) {
    weights.add(Math.round(current));
  }
  return [...weights].sort((a, b) => a - b);
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function EditorControls({ state, onChange }: EditorControlsProps) {
  const sizeOptions = fontSizeOptions(state.fontSize);
  const weightOptions = fontWeightOptions(state.fontWeight);
  const uploaded = state.background.uploadedImage;
  const isImageMode =
    state.background.mode === "UPLOADED_IMAGE" && Boolean(uploaded);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    try {
      const imageUrl = await readImageAsDataUrl(file);
      const existing = state.background.uploadedImage;
      const nextImage = existing
        ? { ...existing, imageUrl }
        : createUploadedImageBackground(
            imageUrl,
            resolveTextColor(state.palette)
          );

      onChange({
        background: {
          mode: "UPLOADED_IMAGE",
          uploadedImage: nextImage,
        },
      });
    } catch (error) {
      console.error("[Background] Image upload failed", error);
      window.alert("Could not load that image. Try a JPG, PNG, or WebP file.");
    }
  };

  return (
    <aside className="control-panel">
      <section className="control-section control-section--text">
        <h2 className="control-section__title">Text:</h2>
        <textarea
          className="control-textarea"
          value={state.text}
          onChange={(event) => onChange({ text: event.target.value })}
          maxLength={80}
        />
      </section>

      <section className="control-section control-section--typography">
        <h2 className="control-section__title">Typography</h2>
        <div className="typography-controls">
          <select
            className="control-select control-select--wide"
            value={state.font}
            aria-label="Font family"
            onChange={(event) =>
              onChange({ font: event.target.value as CreativeState["font"] })
            }
          >
            {FONT_CATALOG.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </select>

          <div className="typography-controls__pair">
            <select
              className="control-select"
              value={state.fontWeight}
              aria-label="Font weight"
              onChange={(event) =>
                onChange({ fontWeight: Number(event.target.value) })
              }
            >
              {weightOptions.map((weight) => (
                <option key={weight} value={weight}>
                  {FONT_WEIGHT_LABELS[weight] ?? String(weight)}
                </option>
              ))}
            </select>
            <select
              className="control-select"
              value={state.fontSize}
              aria-label="Font size"
              onChange={(event) =>
                onChange({ fontSize: Number(event.target.value) })
              }
            >
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="typography-controls__metrics">
            <label className="metric-field">
              <span className="metric-field__label">tracking</span>
              <MetricNumberInput
                value={state.tracking}
                onChange={(tracking) => onChange({ tracking })}
              />
            </label>
            <label className="metric-field">
              <span className="metric-field__label">kerning</span>
              <MetricNumberInput
                value={state.kerning}
                onChange={(kerning) => onChange({ kerning })}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="control-section control-section--motion">
        <h2 className="control-section__title control-section__title--motion">
          Motion + Atmosphere
        </h2>
        {MOTION_DIMENSIONS.map((motionType) => {
          const value = state.motion[motionType];
          const description = MOTION_DIMENSION_DESCRIPTIONS[motionType];
          return (
            <div className="slider-row" key={motionType}>
              <span className="slider-row__label" title={description}>
                {MOTION_DIMENSION_LABELS[motionType]}
              </span>
              <input
                className="slider"
                type="range"
                min={0}
                max={100}
                value={value}
                title={description}
                style={
                  {
                    "--slider-fill-percent": `${value}%`,
                  } as CSSProperties
                }
                onChange={(event) => {
                  const next = { ...state.motion };
                  next[motionType as MotionDimension] = Number(event.target.value);
                  onChange({ motion: next });
                }}
              />
              <span className="slider-row__value" aria-hidden="true">
                {value}
              </span>
            </div>
          );
        })}
      </section>

      <section className="control-section control-section--palette">
        <h2 className="control-section__title">color palette</h2>
        <div className="palette-row">
          {(["background", "textColor"] as const).map((key) => (
            <PaletteSwatch
              key={key}
              color={state.palette[key]}
              label={key === "textColor" ? "text" : key}
              onChange={(color) =>
                onChange({
                  palette: { ...state.palette, [key]: color },
                })
              }
            />
          ))}
          <BackgroundImageSwatch
            tintColor={uploaded?.tintColor ?? resolveTextColor(state.palette)}
            tintOpacity={uploaded?.tintOpacity ?? 0.88}
            isActive={isImageMode}
            hasImage={Boolean(uploaded)}
            onTintChange={(tintColor, tintOpacity) => {
              if (!state.background.uploadedImage) return;
              onChange({
                background: {
                  mode: "UPLOADED_IMAGE",
                  uploadedImage: {
                    ...state.background.uploadedImage,
                    tintColor,
                    tintOpacity,
                  },
                },
              });
            }}
            onActivate={() => {
              if (!state.background.uploadedImage) return;
              onChange({
                background: {
                  ...state.background,
                  mode: "UPLOADED_IMAGE",
                },
              });
            }}
            onClear={() => {
              onChange({
                background: {
                  ...state.background,
                  mode: "AI_COLOR",
                },
              });
            }}
            onUploadFile={handleImageFile}
          />
        </div>
      </section>
    </aside>
  );
}
