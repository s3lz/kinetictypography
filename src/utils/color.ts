export interface HSVA {
  h: number;
  s: number;
  v: number;
  a: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toHexByte(value: number) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
}

export function hsvToRgb(h: number, s: number, v: number) {
  const saturation = s / 100;
  const brightness = v / 100;
  const chroma = brightness * saturation;
  const huePrime = (h / 60) % 6;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (huePrime >= 0 && huePrime < 1) {
    r1 = chroma;
    g1 = x;
  } else if (huePrime < 2) {
    r1 = x;
    g1 = chroma;
  } else if (huePrime < 3) {
    g1 = chroma;
    b1 = x;
  } else if (huePrime < 4) {
    g1 = x;
    b1 = chroma;
  } else if (huePrime < 5) {
    r1 = x;
    b1 = chroma;
  } else {
    r1 = chroma;
    b1 = x;
  }

  const m = brightness - chroma;
  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

export function rgbToHsv(r: number, g: number, b: number): Omit<HSVA, "a"> {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === red) {
      h = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      h = 60 * ((blue - red) / delta + 2);
    } else {
      h = 60 * ((red - green) / delta + 4);
    }
  }
  if (h < 0) {
    h += 360;
  }

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  return { h, s, v };
}

export function parseColor(input: string): HSVA {
  const normalized = (input ?? "").trim().toLowerCase();
  let r = 255;
  let g = 255;
  let b = 255;
  let a = 1;

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      if (hex.length === 8) {
        a = parseInt(hex.slice(6, 8), 16) / 255;
      }
    }
  }

  const { h, s, v } = rgbToHsv(r, g, b);
  return { h, s, v, a };
}

export function formatColor({ h, s, v, a }: HSVA): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  if (a >= 0.999) {
    return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
  }
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}${toHexByte(a * 255)}`;
}

export function hsvaToCssRgb({ h, s, v, a }: HSVA) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}
