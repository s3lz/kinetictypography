import { useState, type DragEvent, type FormEvent } from "react";
import { AudioUrlError, loadAudioFromUrl } from "../lib/loadAudioFromUrl";

interface UploadSectionProps {
  onUpload: (file: File) => void;
}

const ACCEPTED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg"];
const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
  "audio/ogg",
  "application/ogg",
];

function isValidAudioFile(file: File) {
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (extension && ACCEPTED_AUDIO_EXTENSIONS.includes(extension)) {
    return true;
  }

  return ACCEPTED_AUDIO_TYPES.includes(file.type);
}

function getDroppedAudioFile(dataTransfer: DataTransfer) {
  const items = Array.from(dataTransfer.items);
  const fileItem = items.find((item) => item.kind === "file");
  const file = fileItem?.getAsFile() ?? dataTransfer.files[0];
  return file && isValidAudioFile(file) ? file : null;
}

function getUrlErrorMessage(error: unknown): string {
  if (error instanceof AudioUrlError) {
    return error.message;
  }

  return "We couldn't load that audio link. Try a direct MP3, WAV, M4A, or OGG URL.";
}

export function UploadSection({ onUpload }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [audioLink, setAudioLink] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const handleDragEnter = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = getDroppedAudioFile(event.dataTransfer);
    if (file) onUpload(file);
  };

  const handleUrlSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUrlError(null);

    const trimmedLink = audioLink.trim();
    if (!trimmedLink) {
      setUrlError("Paste a direct link to an audio file.");
      return;
    }

    setIsLoadingUrl(true);

    try {
      const file = await loadAudioFromUrl(trimmedLink);
      onUpload(file);
    } catch (error) {
      setUrlError(getUrlErrorMessage(error));
    } finally {
      setIsLoadingUrl(false);
    }
  };

  return (
    <section className="upload-section" aria-label="Upload audio">
      <div className="upload-layout">
        <label
          className={`upload-zone${isDragging ? " upload-zone--dragging" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".mp3,.wav,.m4a,.ogg,audio/mpeg,audio/wav,audio/mp4,audio/ogg"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && isValidAudioFile(file)) {
                onUpload(file);
              }
            }}
          />
          <img
            className="upload-zone__icon"
            src="/assets/upload-icon.svg"
            alt=""
          />
          <div className="upload-zone__copy">
            <p className="upload-zone__text">
              drag audio file here or{" "}
              <span className="upload-zone__choose">choose file</span>
            </p>
            <p className="upload-zone__formats">
              valid formats: mp3, wav, m4a, ogg
            </p>
          </div>
        </label>

        <p className="upload-section__or" aria-hidden="true">
          or
        </p>

        <form className="upload-actions" onSubmit={handleUrlSubmit}>
          <input
            className="field upload-link-field"
            type="url"
            placeholder="paste your link here"
            value={audioLink}
            onChange={(event) => {
              setAudioLink(event.target.value);
              if (urlError) setUrlError(null);
            }}
            disabled={isLoadingUrl}
          />
          <button
            type="submit"
            className="btn-pill upload-submit-btn"
            aria-label="Load audio from link"
            disabled={isLoadingUrl}
          >
            <span className="upload-submit-btn__notes" aria-hidden="true">
              {isLoadingUrl ? "…" : "♫⋆｡♪ ₊˚♬"}
            </span>
          </button>
          {urlError ? (
            <p className="upload-actions__error" role="alert">
              {urlError}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
