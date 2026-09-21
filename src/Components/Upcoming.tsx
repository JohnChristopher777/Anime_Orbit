import React, { useEffect, useCallback } from "react";
import { useGlobalContext } from "../context/global";
import AnimeCard from "./AnimeCard";
import SEO from "./SEO";
import Footer from "./Footer";
import { RefreshCw } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import CatalogGenreFilter, { filterCatalogByGenre } from "./CatalogGenreFilter";

export const Upcoming: React.FC = () => {
  const [genre, setGenre] = React.useState("ALL");
  const {
    upcomingAnime,
    upcomingPage,
    hasMoreUpcoming,
    getUpcomingAnime,
    loading,
  } = useGlobalContext();
  const visibleAnime = React.useMemo(() => filterCatalogByGenre(upcomingAnime, genre), [genre, upcomingAnime]);

  useEffect(() => {
    if (upcomingAnime.length === 0) {
      getUpcomingAnime(1);
    }
  }, [getUpcomingAnime, upcomingAnime.length]);

  const handleLoadMore = () => {
    if (!loading && hasMoreUpcoming) {
      getUpcomingAnime(upcomingPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title="Most Anticipated Upcoming Anime & New Seasons"
        description="Discover upcoming anime releases, new seasonal broadcasts, and highly anticipated movies across all genres on Anime Orbit."
        keywords="upcoming anime, new anime seasons, upcoming anime movies, anime release schedule, Anime Orbit"
        url="https://animeorbit.web.app/upcoming"
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12 flex flex-col gap-6 sm:gap-8 flex-1 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
          <h1 className="font-staatliches font-bold text-2xl sm:text-3xl text-[#ffd700] tracking-wider drop-shadow">
            Upcoming Anime
          </h1>
          <div className="catalog-page-tools"><span className="catalog-count">{upcomingAnime.length} Titles Loaded</span><CatalogGenreFilter items={upcomingAnime} value={genre} onChange={setGenre} /></div>
        </div>

        {/* Grid */}
        {loading && !upcomingAnime.length ? (
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
        ) : upcomingAnime.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
              {visibleAnime.map((anime: any, idx: number) => (
                <AnimeCard key={`upcoming-${anime.mal_id}-${idx}`} anime={anime} />
              ))}
            </div>
            {!visibleAnime.length && <div className="catalog-filter-empty">No {genre} titles are loaded yet. Choose another genre.</div>}

            {hasMoreUpcoming && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] disabled:opacity-50 text-black font-bold px-8 py-3.5 rounded-full text-sm font-montserrat shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  <span>
                    {loading
                      ? "Loading more..."
                      : `Load More (${upcomingAnime.length} loaded)`}
                  </span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-neutral-400 font-medium">
            No upcoming anime found at this time.
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Upcoming;
