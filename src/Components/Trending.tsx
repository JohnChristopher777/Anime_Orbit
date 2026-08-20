import React, { useEffect, useRef, useCallback } from "react";
import { useGlobalContext } from "../context/global";
import AnimeCard from "./AnimeCard";
import SEO from "./SEO";
import { TrendingUp, RefreshCw } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const Trending: React.FC = () => {
  const {
    airingAnime,
    airingPage,
    hasMoreAiring,
    getAiringAnime,
    loading,
  } = useGlobalContext();

  useEffect(() => {
    if (airingAnime.length === 0) {
      getAiringAnime(1);
    }
  }, [getAiringAnime, airingAnime.length]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMoreAiring && !loading) {
            getAiringAnime(airingPage + 1);
          }
        },
        { rootMargin: "300px" }
      );
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMoreAiring, airingPage, getAiringAnime]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <SEO
        title="Top Airing & Trending Anime Series This Season"
        description="Stay up to date with currently broadcasting and trending anime series across all genres. Track weekly episodes and ratings on Anime Orbit."
        keywords="airing anime, trending anime, current anime season, weekly anime episodes, Anime Orbit"
        url="https://animeorbit.web.app/airing"
      />
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <TrendingUp size={28} className="text-[#ffd700]" />
          <h1 className="font-montserrat font-black text-2xl sm:text-3xl text-white">
            Top Airing Anime
          </h1>
          <span className="font-montserrat text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            {airingAnime.length} Titles Loaded
          </span>
        </div>
      </div>

      {/* Grid */}
      {loading && !airingAnime.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-80 bg-neutral-900/60 rounded-xl p-3 border border-white/5"
            >
              <Skeleton
                height={200}
                borderRadius={8}
                baseColor="#262626"
                highlightColor="#3a3a3a"
              />
              <Skeleton
                width="80%"
                height={18}
                baseColor="#262626"
                highlightColor="#3a3a3a"
                className="mt-3"
              />
            </div>
          ))}
        </div>
      ) : airingAnime.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {airingAnime.map((anime: any, idx: number) => (
              <AnimeCard key={`airing-${anime.mal_id}-${idx}`} anime={anime} />
            ))}
          </div>

          {hasMoreAiring && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <button
                onClick={() => getAiringAnime(airingPage + 1)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#ffd700]/15 hover:bg-[#ffd700] border border-[#ffd700]/40 text-[#ffd700] hover:text-black font-montserrat font-bold text-sm transition-all duration-200 hover:scale-105 shadow-[0_0_15px_rgba(255,215,0,0.15)] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                <span>
                  {loading
                    ? "Loading next batch..."
                    : `Load More (${airingAnime.length} loaded)`}
                </span>
              </button>
              <div ref={sentinelRef} className="h-4 w-full" />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-neutral-400 text-base">
          No airing anime found.
        </div>
      )}
    </div>
  );
};

export default Trending;
