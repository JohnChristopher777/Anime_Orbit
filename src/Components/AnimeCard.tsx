import React from "react";
import { Link } from "react-router-dom";
import { Star, Trash } from "lucide-react";

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
}

export const AnimeCard = React.forwardRef<HTMLDivElement, AnimeCardProps>(
  ({ anime, onRemove }, ref) => {
    const imageUrl =
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url ||
      anime.image ||
      anime.image_url ||
      "";

    const displayTitle = anime.title || anime.title_english || "Unknown Anime";
    const score = anime.score;

    return (
      <div
        ref={ref}
        className="group relative flex flex-col h-full bg-[#15151c]/95 rounded-2xl overflow-hidden border border-white/10 hover:border-[#ffd700] shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_30px_rgba(255,215,0,0.25)] transition-all duration-300 hover:-translate-y-2 backdrop-blur-md"
      >
        <Link
          to={`/anime/${anime.mal_id}`}
          className="flex flex-col flex-grow text-inherit no-underline"
        >
          {/* Cover Image Wrapper */}
          <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#0d0d12]">
            <img
              src={imageUrl}
              alt={displayTitle}
              loading="lazy"
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
          <div className="p-3 sm:p-3.5 flex flex-col flex-grow justify-between">
            <h3 className="font-montserrat text-sm sm:text-[15px] font-bold text-white mb-1.5 line-clamp-2 h-10 leading-snug group-hover:text-[#ffd700] transition-colors">
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
            className="w-full bg-red-500/10 hover:bg-red-500 border-t border-red-500/20 text-red-400 hover:text-white py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash size={13} />
            <span>Remove</span>
          </button>
        )}
      </div>
    );
  }
);

AnimeCard.displayName = "AnimeCard";
export default AnimeCard;
