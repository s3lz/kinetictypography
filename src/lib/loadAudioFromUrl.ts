const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg"];

const SUPPORTED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "application/ogg",
]);

const EXTENSION_MIME_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
};

const BLOCKED_HOSTS = [
  "youtube.com",
  "youtu.be",
  "spotify.com",
  "soundcloud.com",
];

export class AudioUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioUrlError";
  }
}

function normalizeMimeType(value: string): string {
  return value.split(";")[0].trim().toLowerCase();
}

function getExtension(name: string): string | undefined {
  return name.toLowerCase().match(/\.[^.]+$/)?.[0];
}

function isSupportedExtension(name: string): boolean {
  const extension = getExtension(name);
  return extension ? SUPPORTED_EXTENSIONS.includes(extension) : false;
}

function isAudioMimeType(mimeType: string): boolean {
  const normalized = normalizeMimeType(mimeType);
  if (!normalized) return false;
  if (SUPPORTED_MIME_TYPES.has(normalized)) return true;
  return normalized.startsWith("audio/");
}

function inferMimeTypeFromName(name: string): string | null {
  const extension = getExtension(name);
  return extension ? EXTENSION_MIME_TYPES[extension] ?? null : null;
}

function getFileNameFromUrl(url: URL): string {
  const segment = url.pathname.split("/").filter(Boolean).pop();
  return segment && segment.length > 0
    ? decodeURIComponent(segment)
    : "audio";
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return BLOCKED_HOSTS.some(
    (blocked) => host === blocked || host.endsWith(`.${blocked}`)
  );
}

export async function loadAudioFromUrl(url: string): Promise<File> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url.trim());
  } catch {
    throw new AudioUrlError(
      "That link doesn't look valid. Paste a direct URL to an audio file."
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new AudioUrlError("Only http and https audio links are supported.");
  }

  if (isBlockedHost(parsedUrl.hostname)) {
    throw new AudioUrlError(
      "That platform isn't supported yet. Paste a direct link to an MP3, WAV, M4A, or OGG file."
    );
  }

  let response: Response;

  try {
    response = await fetch(parsedUrl.toString());
  } catch {
    throw new AudioUrlError(
      "We couldn't reach that link. Check the URL and try again."
    );
  }

  if (!response.ok) {
    throw new AudioUrlError(
      `That link returned an error (${response.status}). Make sure it points to a downloadable audio file.`
    );
  }

  const fileName = getFileNameFromUrl(parsedUrl);
  const contentType = response.headers.get("content-type") ?? "";
  const hasAudioMime = isAudioMimeType(contentType);
  const hasSupportedExtension = isSupportedExtension(fileName);

  if (!hasAudioMime && !hasSupportedExtension) {
    throw new AudioUrlError(
      "That link doesn't appear to be an audio file. Supported formats: MP3, WAV, M4A, OGG."
    );
  }

  const blob = await response.blob();
  let mimeType =
    normalizeMimeType(blob.type) ||
    normalizeMimeType(contentType) ||
    inferMimeTypeFromName(fileName) ||
    "";

  if (!isAudioMimeType(mimeType) && !hasSupportedExtension) {
    throw new AudioUrlError(
      "That link doesn't appear to be an audio file. Supported formats: MP3, WAV, M4A, OGG."
    );
  }

  if (!mimeType && hasSupportedExtension) {
    mimeType = inferMimeTypeFromName(fileName) ?? "application/octet-stream";
  }

  return new File([blob], fileName, { type: mimeType });
}
