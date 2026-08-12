import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatColor,
  hsvaToCssRgb,
  hsvToRgb,
  parseColor,
  type HSVA,
} from "../utils/color";

interface ColorPickerProps {
  value: string;
  anchorRect: DOMRect;
  containerRect?: DOMRect;
  label: string;
  onChange: (color: string) => void;
  onClose: () => void;
  /** Optional clear action (e.g. reset photo background to AI color) */
  onClear?: () => void;
}

const PANEL_WIDTH = 168;
const PANEL_HEIGHT = 228;
const PANEL_HEIGHT_WITH_CLEAR = 258;
const PANEL_MARGIN = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ColorPicker({
  value,
  anchorRect,
  containerRect,
  label,
  onChange,
  onClose,
  onClear,
}: ColorPickerProps) {
  const [hsva, setHsva] = useState<HSVA>(() => parseColor(value));
  const panelRef = useRef<HTMLDivElement>(null);
  const panelHeight = onClear ? PANEL_HEIGHT_WITH_CLEAR : PANEL_HEIGHT;

  useEffect(() => {
    setHsva(parseColor(value));
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const commit = useCallback(
    (next: HSVA | ((prev: HSVA) => HSVA)) => {
      setHsva((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        onChange(formatColor(resolved));
        return resolved;
      });
    },
    [onChange],
  );

  const hueColor = hsvaToCssRgb({ h: hsva.h, s: 100, v: 100, a: 1 });
  const selectedColor = hsvaToCssRgb(hsva);
  const { r, g, b } = hsvToRgb(hsva.h, hsva.s, hsva.v);

  const bounds = containerRect ?? {
    top: 12,
    left: 12,
    right: window.innerWidth - 12,
    bottom: window.innerHeight - 12,
  } as DOMRect;

  const left = clamp(
    anchorRect.left + anchorRect.width / 2 - PANEL_WIDTH / 2,
    bounds.left + PANEL_MARGIN,
    bounds.right - PANEL_WIDTH - PANEL_MARGIN,
  );

  let top = anchorRect.top - panelHeight - PANEL_MARGIN;
  if (top < bounds.top + PANEL_MARGIN) {
    top = anchorRect.bottom + PANEL_MARGIN;
  }
  top = clamp(
    top,
    bounds.top + PANEL_MARGIN,
    bounds.bottom - panelHeight - PANEL_MARGIN,
  );

  const updateFromSurface = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);
    commit((current) => ({
      ...current,
      s: x * 100,
      v: (1 - y) * 100,
    }));
  };

  const bindSurfaceDrag = (
    onMove: (clientX: number, clientY: number, rect: DOMRect) => void,
  ) => ({
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      onMove(event.clientX, event.clientY, rect);

      const handleMove = (moveEvent: PointerEvent) => {
        onMove(moveEvent.clientX, moveEvent.clientY, rect);
      };
      const handleUp = () => {
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
  });

  return createPortal(
    <div
      ref={panelRef}
      className="color-picker"
      style={{ top, left, width: PANEL_WIDTH }}
      role="dialog"
      aria-label={`${label} color picker`}
    >
      <div
        className="color-picker__surface"
        style={{ backgroundColor: hueColor }}
        {...bindSurfaceDrag(updateFromSurface)}
      >
        <div className="color-picker__surface-white" />
        <div className="color-picker__surface-black" />
        <span
          className="color-picker__handle"
          style={{
            left: `${hsva.s}%`,
            top: `${100 - hsva.v}%`,
          }}
        />
      </div>

      <div
        className="color-picker__slider color-picker__slider--hue"
        {...bindSurfaceDrag((clientX, _clientY, rect) => {
          const x = clamp((clientX - rect.left) / rect.width, 0, 1);
          commit((current) => ({ ...current, h: x * 360 }));
        })}
      >
        <span
          className="color-picker__handle"
          style={{ left: `${(hsva.h / 360) * 100}%` }}
        />
      </div>

      <div
        className="color-picker__slider color-picker__slider--alpha"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 0), ${selectedColor}), repeating-conic-gradient(#d9d9d9 0% 25%, #fff 0% 50%)`,
          backgroundSize: "100% 100%, 0.5rem 0.5rem",
        }}
        {...bindSurfaceDrag((clientX, _clientY, rect) => {
          const x = clamp((clientX - rect.left) / rect.width, 0, 1);
          commit((current) => ({ ...current, a: x }));
        })}
      >
        <span
          className="color-picker__handle"
          style={{ left: `${hsva.a * 100}%` }}
        />
      </div>

      {onClear ? (
        <button
          type="button"
          className="color-picker__clear"
          onClick={() => {
            onClear();
            onClose();
          }}
        >
          clear
        </button>
      ) : null}
    </div>,
    document.body,
  );
}

interface PaletteSwatchProps {
  color: string;
  label: string;
  onChange: (color: string) => void;
}

export function PaletteSwatch({ color, label, onChange }: PaletteSwatchProps) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const openPicker = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    const panel = buttonRef.current
      ?.closest(".control-panel")
      ?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setAnchorRect(rect);
    setContainerRect(panel ?? null);
    setOpen(true);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="palette-swatch"
        style={{ backgroundColor: color }}
        onClick={openPicker}
        aria-label={`${label} color`}
      />
      {open && anchorRect ? (
        <ColorPicker
          value={color}
          anchorRect={anchorRect}
          containerRect={containerRect ?? undefined}
          label={label}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

interface BackgroundImageSwatchProps {
  tintColor: string;
  tintOpacity: number;
  isActive: boolean;
  hasImage: boolean;
  onTintChange: (tintColor: string, tintOpacity: number) => void;
  onClear: () => void;
  onActivate: () => void;
  onUploadFile: (file: File) => void;
}

/**
 * Palette-row upload control. Empty → file picker; with image → same hue
 * picker UI as color swatches (tint + opacity), plus clear → AI color mode.
 */
export function BackgroundImageSwatch({
  tintColor,
  tintOpacity,
  isActive,
  hasImage,
  onTintChange,
  onClear,
  onActivate,
  onUploadFile,
}: BackgroundImageSwatchProps) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickerValue = formatColor({
    ...parseColor(tintColor),
    a: tintOpacity,
  });

  const openPicker = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    const panel = buttonRef.current
      ?.closest(".control-panel")
      ?.getBoundingClientRect();
    if (!rect) return;
    setAnchorRect(rect);
    setContainerRect(panel ?? null);
    setOpen(true);
  };

  const handleClick = () => {
    if (!hasImage) {
      fileInputRef.current?.click();
      return;
    }
    if (!isActive) {
      onActivate();
    }
    openPicker();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={
          isActive
            ? "palette-swatch"
            : "palette-swatch palette-swatch--upload"
        }
        style={isActive ? { backgroundColor: tintColor } : undefined}
        onClick={handleClick}
        aria-label={
          hasImage
            ? isActive
              ? "Photo background tint"
              : "Use photo background"
            : "Upload background image"
        }
      >
        {isActive ? null : (
          <span className="palette-swatch__plus" aria-hidden="true">
            +
          </span>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="palette-upload-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onUploadFile(file);
        }}
      />
      {open && hasImage && anchorRect ? (
        <ColorPicker
          value={pickerValue}
          anchorRect={anchorRect}
          containerRect={containerRect ?? undefined}
          label="photo tint"
          onChange={(color) => {
            const next = parseColor(color);
            onTintChange(formatColor({ ...next, a: 1 }), next.a);
          }}
          onClear={onClear}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
