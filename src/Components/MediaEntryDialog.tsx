import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, Film, X } from "lucide-react";
import ProgressiveImage from "./ProgressiveImage";

export interface MediaGuideEntry {
  number: number | string;
  title?: string;
  summary?: string;
  thumbnail?: string;
  aired?: string | null;
  length?: number | null;
  pages?: number | null;
  externalUrl?: string | null;
  site?: string;
  source?: string;
  metadataAvailable?: boolean;
}

interface MediaEntryDialogProps {
  entry: MediaGuideEntry | null;
  kind: "episode" | "chapter";
  seriesTitle: string;
  fallbackImage?: string;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

const readableDate = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

const MediaEntryDialog: React.FC<MediaEntryDialogProps> = ({
  entry,
  kind,
  seriesTitle,
  fallbackImage,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}) => {
  useEffect(() => {
    if (!entry) return;
    const previousOverflow = document.body.style.overflow;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasPrevious) onPrevious?.();
      if (event.key === "ArrowRight" && hasNext) onNext?.();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [entry, hasNext, hasPrevious, onClose, onNext, onPrevious]);

  if (!entry || typeof document === "undefined") return null;

  const label = kind === "episode" ? "Episode" : "Chapter";
  const publishedDate = readableDate(entry.aired);
  const visual = entry.thumbnail || fallbackImage;
  const summary = entry.summary?.trim()
    || (entry.metadataAvailable === false
      ? `${label} details are not published in the connected catalogues.`
      : `No published synopsis is available for this ${kind}.`);

  return createPortal(
    <div className="media-entry-dialog__backdrop" role="presentation" onMouseDown={onClose}>
      <div className="media-entry-dialog__shell" onMouseDown={(event) => event.stopPropagation()}>
        <section
          className="media-entry-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-entry-dialog-title"
        >
        <button className="media-entry-dialog__close" type="button" onClick={onClose} aria-label={`Close ${kind} details`}>
          <X size={19} />
        </button>

        <div className="media-entry-dialog__visual">
          {visual ? (
            <ProgressiveImage
              key={`${kind}-${entry.number}-${visual}`}
              src={visual}
              alt=""
              wrapperClassName="media-entry-dialog__image"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="media-entry-dialog__placeholder">
              {kind === "episode" ? <Film size={34} /> : <BookOpen size={34} />}
            </div>
          )}
          <div className="media-entry-dialog__visual-shade" />
          <span className="media-entry-dialog__number">{label} {entry.number}</span>
        </div>

        <div className="media-entry-dialog__content">
          <p className="media-entry-dialog__eyebrow">{seriesTitle}</p>
          <h2 id="media-entry-dialog-title">{entry.title || `${label} ${entry.number}`}</h2>
          <div className="media-entry-dialog__meta">
            {publishedDate && <span><CalendarDays size={15} /> {publishedDate}</span>}
            {kind === "episode" && Number(entry.length) > 0 && <span><Clock3 size={15} /> {entry.length} min</span>}
            {kind === "chapter" && Number(entry.pages) > 0 && <span><BookOpen size={15} /> {entry.pages} pages</span>}
            {(entry.source || entry.site) && <span>Source: {entry.source || entry.site}</span>}
          </div>
          <p className="media-entry-dialog__summary">{summary}</p>

          <div className="media-entry-dialog__footer">
            <div className="media-entry-dialog__nav media-entry-dialog__nav--desktop">
              <button type="button" onClick={onPrevious} disabled={!hasPrevious}><ChevronLeft size={16} /> Previous</button>
              <button type="button" onClick={onNext} disabled={!hasNext}>Next <ChevronRight size={16} /></button>
            </div>
            {entry.externalUrl && (
              <a href={entry.externalUrl} target="_blank" rel="noopener noreferrer">
                Open source <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>
        </section>
        <div className="media-entry-dialog__nav media-entry-dialog__nav--mobile" aria-label={`${label} navigation`}>
          <button type="button" onClick={onPrevious} disabled={!hasPrevious}><ChevronLeft size={18} /> Previous</button>
          <button type="button" onClick={onNext} disabled={!hasNext}>Next <ChevronRight size={18} /></button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MediaEntryDialog;
