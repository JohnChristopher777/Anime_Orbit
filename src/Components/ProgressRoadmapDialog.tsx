import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Check, ExternalLink, Flag, MessageSquare, Pencil, PlayCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { MangaWatchlistItem, WatchlistItem } from "../context/WatchlistContext";

interface ProgressRoadmapDialogProps {
  item: WatchlistItem | MangaWatchlistItem | null;
  mediaType: "anime" | "manga";
  onClose: () => void;
}

const readableDate = (value?: string) => {
  if (!value) return "Saved earlier";
  const parsed = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Saved earlier"
    : parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const plainText = (value = "") => value.replace(/==(.+?)==/g, "$1");

const ProgressRoadmapDialog: React.FC<ProgressRoadmapDialogProps> = ({ item, mediaType, onClose }) => {
  useEffect(() => {
    if (!item) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [item, onClose]);

  if (!item || typeof document === "undefined") return null;

  const isManga = mediaType === "manga";
  const isMovie = !isManga && /movie|film/i.test(String(item.type || ""));
  const notes = [...(item.progressNotes || [])].sort(
    (left, right) => Date.parse(left.createdAt || "") - Date.parse(right.createdAt || ""),
  );
  const total = Number(isManga ? (item as MangaWatchlistItem).chapters || 0 : item.episodes || 0);

  return createPortal(
    <div className="quick-roadmap__backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="quick-roadmap" role="dialog" aria-modal="true" aria-labelledby="quick-roadmap-title">
        <header>
          <div>
            <span>{isManga ? "Reading roadmap" : "Progress roadmap"}</span>
            <h2 id="quick-roadmap-title">{item.title}</h2>
            <p>{Number(item.progress || 0)}{total > 0 ? ` / ${total}` : ""} {isManga ? "chapters" : isMovie ? "movie" : "episodes"} · {item.status}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close roadmap"><X size={18} /></button>
        </header>

        <div className="quick-roadmap__timeline">
          <article>
            <i><Flag size={14} /></i>
            <div><span>Added</span><strong>{readableDate(item.addedAt)}</strong></div>
          </article>
          {item.startDate && <article>
            <i><PlayCircle size={14} /></i>
            <div><span>{isManga ? "Started reading" : "Started watching"}</span><strong>{readableDate(item.startDate)}</strong></div>
          </article>}
          {notes.map((entry, index) => <article className="is-memory" key={entry.id || `${entry.createdAt}-${index}`}>
            <i><MessageSquare size={14} /></i>
            <div>
              <span>{isMovie ? "Movie memory" : `${isManga ? "Chapter" : "Episode"} ${entry.progress}`}</span>
              <strong>{readableDate(entry.createdAt)}</strong>
              <p>{plainText(entry.note)}</p>
            </div>
          </article>)}
          {item.endDate && <article>
            <i><Check size={14} /></i>
            <div><span>Completed</span><strong>{readableDate(item.endDate)}</strong></div>
          </article>}
        </div>

        {item.personalNotes && <div className="quick-roadmap__afterthought"><BookOpen size={15} /><div><span>After-thought</span><p>{plainText(item.personalNotes)}</p></div></div>}

        <footer>
          <Link to={`/${mediaType}/${item.mal_id}`} onClick={onClose}>Open title <ExternalLink size={13} /></Link>
          <Link className="is-primary" to={`/watchlist?media=${mediaType}&edit=${item.mal_id}`} onClick={onClose}><Pencil size={13} /> Edit in {isManga ? "reading list" : "watchlist"}</Link>
        </footer>
      </section>
    </div>,
    document.body,
  );
};

export default ProgressRoadmapDialog;
