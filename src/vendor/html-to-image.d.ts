export interface Options {
  width?: number;
  height?: number;
  backgroundColor?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  style?: Partial<CSSStyleDeclaration>;
  filter?: (domNode: HTMLElement) => boolean;
  quality?: number;
  cacheBust?: boolean;
  pixelRatio?: number;
  skipFonts?: boolean;
  fontEmbedCSS?: string;
}

export function toCanvas(
  node: HTMLElement,
  options?: Options
): Promise<HTMLCanvasElement>;

export function getFontEmbedCSS(
  node: HTMLElement,
  options?: Options
): Promise<string>;

export function toPng(node: HTMLElement, options?: Options): Promise<string>;

export function toBlob(
  node: HTMLElement,
  options?: Options
): Promise<Blob | null>;
