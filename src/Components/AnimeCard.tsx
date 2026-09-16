import React from "react";
import { Link } from "react-router-dom";
import { Star, Trash } from "lucide-react";
import ProgressiveImage from "./ProgressiveImage";

export interface AnimeCardProps {
  anime: {
    mal_id: number;
    title?: string;
    title_english?: string;
    images?: {
      jpg?: {
        large_image_url?: string;
        image_url?: string;
      };
    };
    image?: string;
    image_url?: string;
    score?: number | string | null;
    type?: string;
    episodes?: number | null;
  };
  onRemove?: (animeId: number) => void;
  compact?: boolean;
}

export const AnimeCard = React.forwardRef<HTMLDivElement, AnimeCardProps>(
  ({ anime, onRemove, compact = false }, ref) => {
    const imageUrl =
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url ||
      anime.image ||
      anime.image_url ||
      "";
    const smallImageUrl = anime.images?.jpg?.image_url;
    const responsiveSources = smallImageUrl && smallImageUrl !== imageUrl
      ? `${smallImageUrl} 320w, ${imageUrl} 600w`
      : undefined;

    const displayTitle = anime.title || anime.title_english || "Unknown Anime";
    const score = anime.score;

    return (
      <div
        ref={ref}
        className={`group relative flex flex-col bg-transparent rounded-lg transition-transform duration-200 hover:-translate-y-1 ${compact ? "" : "h-full"}`}
      >
        <Link
          to={`/anime/${anime.mal_id}`}
          className={`flex flex-col text-inherit no-underline ${compact ? "" : "flex-grow"}`}
        >
          {/* Cover Image Wrapper */}
          <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg bg-[#19191f] shadow-[0_5px_18px_rgba(0,0,0,.28)] ring-1 ring-white/[0.06] group-hover:ring-white/20">
            <ProgressiveImage
              src={imageUrl}
              alt={displayTitle}
              loading="lazy"
              decoding="async"
              srcSet={responsiveSources}
              sizes="(max-width: 640px) 43vw, (max-width: 1280px) 20vw, 196px"
              wrapperClassName="w-full h-full"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {score && (
              <div className="absolute top-2.5 left-2.5 bg-[#0e0e12]/90 backdrop-blur-md border border-[#ffd700]/70 text-[#ffd700] px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 z-10 shadow-lg">
                <Star size={11} fill="#ffd700" color="#ffd700" />
                <span>{score}</span>
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="pt-2.5 flex flex-col flex-grow justify-between">
            <h3 className="font-montserrat text-sm font-bold text-white mb-1.5 line-clamp-2 h-10 leading-snug group-hover:text-[#ffd700] transition-colors">
              {displayTitle}
            </h3>
            <div className="text-xs text-neutral-400 flex items-center justify-between mt-auto pt-2 font-medium border-t border-white/5">
              <span>{anime.type || "TV"}</span>
              <span>{anime.episodes ? `${anime.episodes} EP` : "N/A"}</span>
            </div>
          </div>
        </Link>

        {onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onRemove(anime.mal_id);
            }}
            className={compact ? "absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-lg border border-red-400/25 bg-[#27171b] text-red-300 hover:bg-red-500 hover:text-white transition-colors cursor-pointer" : "w-full bg-red-500/10 hover:bg-red-500 border-t border-red-500/20 text-red-400 hover:text-white py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"}
            aria-label={`Remove ${displayTitle}`}
            title="Remove from list"
          >
            <Trash size={13} />
            {!compact && <span>Remove</span>}
          </button>
        )}
      </div>
    );
  }
);

AnimeCard.displayName = "AnimeCard";
export default AnimeCard;
