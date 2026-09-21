import React from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import AnimeCard from "./AnimeCard";
import CatalogGenreFilter, { filterCatalogByGenre } from "./CatalogGenreFilter";

interface AnimeRowProps {
  title: string;
  items: any[];
  to: string;
  loading?: boolean;
  genre?: string;
  showGenreFilter?: boolean;
}

const RowSkeleton = () => (
  <div className="catalog-row" aria-label="Loading titles">
    {Array.from({ length: 7 }).map((_, index) => (
      <div className="catalog-row__item" key={index}>
        <div className="aspect-[2/3] rounded-xl bg-white/[0.06] animate-pulse" />
        <div className="mt-3 h-3.5 w-4/5 rounded bg-white/[0.06] animate-pulse" />
        <div className="mt-2 h-3 w-2/5 rounded bg-white/[0.04] animate-pulse" />
      </div>
    ))}
  </div>
);

export const AnimeRow: React.FC<AnimeRowProps> = ({ title, items, to, loading = false, genre: controlledGenre, showGenreFilter = true }) => {
  const [localGenre, setLocalGenre] = React.useState("ALL");
  const activeGenre = controlledGenre ?? localGenre;
  const visibleItems = React.useMemo(() => filterCatalogByGenre(items, activeGenre), [activeGenre, items]);
  const titleId = `${title.replace(/\s+/g, "-").toLowerCase()}-title`;
  const rowRef = React.useRef<HTMLDivElement>(null);
  const interactionPaused = React.useRef(false);
  const cursorSteer = React.useRef(0);
  const pauseUntil = React.useRef(0);

  const pauseAutomaticMovement = React.useCallback((milliseconds = 5000) => {
    pauseUntil.current = performance.now() + milliseconds;
  }, []);

  const moveRow = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    pauseAutomaticMovement();
    row.scrollBy({ left: direction * Math.max(260, row.clientWidth * 0.72), behavior: "smooth" });
  };

  React.useEffect(() => {
    const row = rowRef.current;
    if (!row || visibleItems.length < 7 || window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(max-width: 767px)").matches) return;

    let frame = 0;
    let lastTime = performance.now();
    const move = (time: number) => {
      const elapsed = Math.min(time - lastTime, 100);
      lastTime = time;
      if (!interactionPaused.current && time > pauseUntil.current && document.visibilityState === "visible") {
        const maxScroll = row.scrollWidth - row.clientWidth;
        if (maxScroll > 0) {
          const steer = cursorSteer.current;
          const edgeBoost = Math.max(0, Math.abs(steer) - 0.22) / 0.78;
          const direction = edgeBoost > 0 ? Math.sign(steer) : 1;
          const pixelsPerSecond = 10 + edgeBoost * 90;
          const nextPosition = row.scrollLeft + direction * pixelsPerSecond * (elapsed / 1000);
          if (nextPosition > maxScroll) row.scrollLeft = 0;
          else if (nextPosition < 0) row.scrollLeft = maxScroll;
          else row.scrollLeft = nextPosition;
        }
      }
      frame = window.requestAnimationFrame(move);
    };
    frame = window.requestAnimationFrame(move);
    return () => window.cancelAnimationFrame(frame);
  }, [visibleItems.length]);

  return (
    <section className="home-rail" aria-labelledby={titleId}>
      <div className="home-rail__header">
        <h2 id={titleId}>{title}</h2>
        <div className="home-rail__actions">
          {showGenreFilter && <CatalogGenreFilter items={items} value={localGenre} onChange={setLocalGenre} compact />}
          <button type="button" onClick={() => moveRow(-1)} aria-label={`Scroll ${title} left`}><ChevronLeft size={17} /></button>
          <button type="button" onClick={() => moveRow(1)} aria-label={`Scroll ${title} right`}><ChevronRight size={17} /></button>
          <Link to={to} className="home-rail__link"><span>View All</span><ArrowRight size={16} /></Link>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <RowSkeleton />
      ) : (
        <div
          ref={rowRef}
          className="catalog-row"
          onWheel={(event) => {
            pauseAutomaticMovement();
            const horizontalDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY)
              ? event.deltaX
              : event.shiftKey
                ? event.deltaY
                : 0;
            if (horizontalDelta !== 0) {
              event.preventDefault();
              event.currentTarget.scrollLeft += horizontalDelta;
            }
          }}
          onPointerDown={() => { interactionPaused.current = true; }}
          onPointerUp={() => { interactionPaused.current = false; pauseAutomaticMovement(); }}
          onPointerCancel={() => { interactionPaused.current = false; pauseAutomaticMovement(); }}
          onTouchStart={() => { interactionPaused.current = true; }}
          onTouchEnd={() => { interactionPaused.current = false; pauseAutomaticMovement(); }}
          onMouseMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            cursorSteer.current = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
          }}
          onMouseLeave={() => { cursorSteer.current = 0; }}
          onFocusCapture={() => { interactionPaused.current = true; }}
          onBlurCapture={() => { interactionPaused.current = false; pauseAutomaticMovement(1200); }}
          aria-label={title}
        >
          {visibleItems.slice(0, 12).map((anime, index) => (
            <div className="catalog-row__item" key={`${title}-${anime.mal_id}-${index}`}>
              <AnimeCard anime={anime} />
            </div>
          ))}
          {!visibleItems.length && !loading && <p className="catalog-row__empty">No {activeGenre} titles are loaded in this row yet.</p>}
        </div>
      )}
    </section>
  );
};

export default React.memo(AnimeRow);
