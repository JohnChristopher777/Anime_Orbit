import React, { useEffect, useRef, useCallback } from "react";
import { useGlobalContext } from "../context/global";
import AnimeCard from "./AnimeCard";
import { Calendar, RefreshCw } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const Upcoming: React.FC = () => {
  const {
    upcomingAnime,
    upcomingPage,
    hasMoreUpcoming,
    getUpcomingAnime,
    loading,
  } = useGlobalContext();

  useEffect(() => {
    if (upcomingAnime.length === 0) {
      getUpcomingAnime(1);
    }
  }, [getUpcomingAnime, upcomingAnime.length]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMoreUpcoming && !loading) {
            getUpcomingAnime(upcomingPage + 1);
          }
        },
        { rootMargin: "300px" }
      );
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMoreUpcoming, upcomingPage, getUpcomingAnime]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <Calendar size={28} className="text-[#ffd700]" />
          <h1 className="font-montserrat font-black text-2xl sm:text-3xl text-white">
            Upcoming Anime Releases
          </h1>
          <span className="font-montserrat text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            {upcomingAnime.length} Titles Loaded
          </span>
        </div>
      </div>

      {/* Grid */}
      {loading && !upcomingAnime.length ? (
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
      ) : upcomingAnime.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {upcomingAnime.map((anime: any, idx: number) => (
              <AnimeCard key={`upcoming-${anime.mal_id}-${idx}`} anime={anime} />
            ))}
          </div>

          {hasMoreUpcoming && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <button
                onClick={() => getUpcomingAnime(upcomingPage + 1)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#ffd700]/15 hover:bg-[#ffd700] border border-[#ffd700]/40 text-[#ffd700] hover:text-black font-montserrat font-bold text-sm transition-all duration-200 hover:scale-105 shadow-[0_0_15px_rgba(255,215,0,0.15)] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                <span>
                  {loading
                    ? "Loading next batch..."
                    : `Load More (${upcomingAnime.length} loaded)`}
                </span>
              </button>
              <div ref={sentinelRef} className="h-4 w-full" />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-neutral-400 text-base">
          No upcoming anime found.
        </div>
      )}
    </div>
  );
};

export default Upcoming;
