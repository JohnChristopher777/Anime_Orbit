import React, { useEffect, useCallback } from "react";
import { useGlobalContext } from "../context/global";
import AnimeCard from "./AnimeCard";
import SEO from "./SEO";
import Footer from "./Footer";
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

  const handleLoadMore = () => {
    if (!loading && hasMoreAiring) {
      getAiringAnime(airingPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title="Top Airing & Trending Anime Series This Season"
        description="Stay up to date with currently broadcasting and trending anime series across all genres. Track weekly episodes and ratings on Anime Orbit."
        keywords="airing anime, trending anime, current anime season, weekly anime episodes, Anime Orbit"
        url="https://animeorbit.web.app/airing"
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 pb-12 flex flex-col gap-6 sm:gap-8 flex-1 w-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-wrap gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <TrendingUp size={24} className="text-[#ffd700] sm:w-7 sm:h-7" />
            <h1 className="font-montserrat font-black text-xl sm:text-3xl text-white">
              Top Airing Anime
            </h1>
            <span className="font-montserrat text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              {airingAnime.length} Titles Loaded
            </span>
          </div>
        </div>

        {/* Grid */}
        {loading && !airingAnime.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
              {airingAnime.map((anime: any, idx: number) => (
                <AnimeCard key={`airing-${anime.mal_id}-${idx}`} anime={anime} />
              ))}
            </div>

            {hasMoreAiring && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] disabled:opacity-50 text-black font-bold px-8 py-3.5 rounded-full text-sm font-montserrat shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  <span>
                    {loading
                      ? "Fetching Next Batch..."
                      : `Load More (${airingAnime.length} loaded)`}
                  </span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-neutral-400 font-medium">
            No airing anime found at this time.
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Trending;
