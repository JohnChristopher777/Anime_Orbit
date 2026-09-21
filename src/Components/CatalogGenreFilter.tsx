import React from "react";
import { Filter } from "lucide-react";
import AppDropdown from "./AppDropdown";

export const animeGenreNames = (anime: any): string[] =>
  (anime?.genres || [])
    .map((genre: any) => (typeof genre === "string" ? genre : genre?.name))
    .filter(Boolean);

export const catalogGenres = (items: any[]): string[] =>
  [...new Set(items.flatMap(animeGenreNames))].sort((a, b) => a.localeCompare(b));

export const filterCatalogByGenre = (items: any[], genre: string): any[] =>
  genre === "ALL" ? items : items.filter((anime) => animeGenreNames(anime).includes(genre));

interface CatalogGenreFilterProps {
  items: any[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  compact?: boolean;
}

const CatalogGenreFilter: React.FC<CatalogGenreFilterProps> = ({ items, value, onChange, className = "", compact = false }) => {
  const genres = React.useMemo(() => catalogGenres(items), [items]);
  React.useEffect(() => {
    if (value !== "ALL" && !genres.includes(value)) onChange("ALL");
  }, [genres, onChange, value]);

  return (
    <div className={`catalog-genre-filter ${compact ? "is-compact" : ""} ${className}`}>
      <Filter size={14} aria-hidden="true" />
      <AppDropdown
        ariaLabel="Filter anime by genre"
        value={value}
        onChange={onChange}
        options={[{ value: "ALL", label: "All genres" }, ...genres.map((genre) => ({ value: genre, label: genre }))]}
      />
    </div>
  );
};

export default CatalogGenreFilter;
