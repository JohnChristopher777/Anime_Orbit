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

  const moveRow = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: direction * Math.max(260, row.clientWidth * 0.72), behavior: "smooth" });
  };

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
          aria-label={title}
        >
          {visibleItems.slice(0, 12).map((anime, index) => (
            <div className="catalog-row__item" key={`${title}-${anime.mal_id}-${index}`}>
              <AnimeCard anime={anime} />
            </div>
          ))}
          {visibleItems.length > 0 && (
            <Link className="catalog-row__more" to={to} aria-label={`Look for more ${title}`}>
              <span>Explore more</span>
              <strong>{title}</strong>
              <i><ArrowRight size={21} /></i>
            </Link>
          )}
          {!visibleItems.length && !loading && <p className="catalog-row__empty">No {activeGenre} titles are loaded in this row yet.</p>}
        </div>
      )}
    </section>
  );
};

export default React.memo(AnimeRow);
