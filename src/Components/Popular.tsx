import React, { memo, useEffect, useRef, useCallback } from "react";
import { useGlobalContext } from "../context/global";
import gsap from "gsap";
import AnimeCard from "./AnimeCard";
import SEO from "./SEO";
import { RefreshCw } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface PopularProps {
  rendered?: "popular" | "search" | string;
  popularAnime?: any[];
}

export const Popular: React.FC<PopularProps> = ({ rendered = "popular", popularAnime }) => {
  const {
    trendingAnime,
    popularPage,
    hasMorePopular,
    getPopularAnime,
    loading,
  } = useGlobalContext();

  const safePopularAnime = popularAnime || [];
  const safeTrendingAnime = trendingAnime || [];
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const validRefs = cardsRef.current.filter(Boolean);
    if (validRefs.length > 0) {
      gsap.fromTo(
        validRefs,
        { opacity: 0, y: 50, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.05,
          ease: "back.out(1.2)",
        }
      );
    }
  }, [safePopularAnime]);

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (rendered === "search") return;
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMorePopular && !loading) {
            getPopularAnime(popularPage + 1);
          }
        },
        { rootMargin: "300px" }
      );
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMorePopular, popularPage, getPopularAnime, rendered]
  );

  if (loading && !safePopularAnime.length) {
    return (
      <div className="flex flex-col items-center min-h-screen py-8 px-4">
        <div className="w-full max-w-7xl px-2 sm:px-4 mb-8">
          <h2 className="font-staatliches font-bold text-2xl sm:text-3xl text-[#ffd700] tracking-wider mb-6 drop-shadow">
            Popular Anime
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="p-3 bg-[#2a2a2a]/70 rounded-xl h-80 border border-white/5"
              >
                <Skeleton
                  height={200}
                  borderRadius={8}
                  baseColor="#1f1f1f"
                  highlightColor="#333333"
                />
                <Skeleton
                  width="80%"
                  height={18}
                  baseColor="#1f1f1f"
                  highlightColor="#333333"
                  className="mt-3 mb-1.5"
                />
                <Skeleton
                  width="40%"
                  height={14}
                  baseColor="#1f1f1f"
                  highlightColor="#333333"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!safePopularAnime.length && !safeTrendingAnime.length) {
    return (
      <div className="text-center py-16 text-neutral-400 font-medium">
        No anime available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4">
      <SEO
        title={rendered === "search" ? "Search Anime Results" : "Top Rated & Most Popular Anime of All Time"}
        description="Explore the highest-rated and most popular anime series and movies across all genres. Filter, search, and discover timeless masterpieces on Anime Orbit."
        keywords="popular anime, top rated anime, best anime of all time, all genres, anime catalog, Anime Orbit"
        url="https://animeorbit.web.app/popular"
      />
      {safePopularAnime.length > 0 && (
        <div className="w-full max-w-7xl px-2 sm:px-4 mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-staatliches font-bold text-2xl sm:text-3xl text-[#ffd700] tracking-wider drop-shadow">
              {rendered === "search" ? "Search Results" : "Popular Anime"}
            </h2>
            {rendered !== "search" && (
              <span className="font-montserrat text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {safePopularAnime.length} Titles Loaded
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {safePopularAnime.map((anime, index) => (
              <AnimeCard
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                anime={anime}
                key={`popular-${anime.mal_id}-${index}`}
              />
            ))}
          </div>

          {rendered !== "search" && hasMorePopular && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <button
                onClick={() => getPopularAnime(popularPage + 1)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#ffd700]/15 hover:bg-[#ffd700] border border-[#ffd700]/40 text-[#ffd700] hover:text-black font-montserrat font-bold text-sm transition-all duration-200 hover:scale-105 shadow-[0_0_15px_rgba(255,215,0,0.15)] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                <span>
                  {loading
                    ? "Loading next batch..."
                    : `Load More (${safePopularAnime.length} loaded)`}
                </span>
              </button>
              <div ref={sentinelRef} className="h-4 w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(Popular);
