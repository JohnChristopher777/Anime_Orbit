import React, { memo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGlobalContext } from "../context/global";
import AnimeCard from "./AnimeCard";
import SEO from "./SEO";
import { RefreshCw, Search, ArrowLeft, Home } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import CatalogGenreFilter, { filterCatalogByGenre } from "./CatalogGenreFilter";
import Footer from "./Footer";

interface PopularProps {
  rendered?: "popular" | "search" | string;
  popularAnime?: any[];
}

export const Popular: React.FC<PopularProps> = ({ rendered = "popular", popularAnime }) => {
  const [genre, setGenre] = React.useState("ALL");
  const {
    popularAnime: contextPopularAnime,
    popularPage,
    hasMorePopular,
    getPopularAnime,
    loading,
  } = useGlobalContext();

  const safePopularAnime = popularAnime || contextPopularAnime || [];
  const visibleAnime = React.useMemo(() => rendered === "search" ? safePopularAnime : filterCatalogByGenre(safePopularAnime, genre), [genre, rendered, safePopularAnime]);

  useEffect(() => {
    if (rendered !== "search" && contextPopularAnime.length === 0) getPopularAnime(1);
  }, [rendered, contextPopularAnime.length, getPopularAnime]);

  // Manual button click pagination only (locked against automatic scroll reloads)
  const handleLoadMore = () => {
    if (!loading && hasMorePopular) {
      getPopularAnime(popularPage + 1);
    }
  };

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

  if (!safePopularAnime.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
        <div className="text-center py-16 px-6 bg-[#12121a]/80 rounded-3xl border border-white/10 space-y-4 max-w-md w-full shadow-2xl">
          <Search size={48} className="mx-auto text-neutral-600" />
          <h3 className="font-montserrat font-bold text-lg text-white">
            {rendered === "search" ? "No Matching Anime Found" : "No Anime Available"}
          </h3>
          <p className="text-xs text-neutral-400">
            {rendered === "search"
              ? "We couldn't find any results matching your search. Try different keywords or browse trending anime."
              : "No anime titles are currently loaded. Return to home or explore genres."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-montserrat font-bold text-xs px-4 py-2 rounded-full transition-all cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Go Back</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 bg-[#ffd700] text-black font-montserrat font-bold text-xs px-5 py-2 rounded-full transition-all hover:scale-105 shadow-md"
            >
              <Home size={13} />
              <span>Return Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col"><main className="flex flex-col items-center py-8 px-4 flex-1">
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
            {rendered !== "search" && <div className="catalog-page-tools"><span className="catalog-count">{safePopularAnime.length} Titles Loaded</span><CatalogGenreFilter items={safePopularAnime} value={genre} onChange={setGenre} /></div>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {visibleAnime.map((anime, index) => (
              <AnimeCard anime={anime} key={`popular-${anime.mal_id}-${index}`} />
            ))}
          </div>
          {!visibleAnime.length && <div className="catalog-filter-empty">No {genre} titles are loaded yet. Choose another genre.</div>}

          {rendered !== "search" && hasMorePopular && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] disabled:opacity-50 text-black font-bold px-8 py-3.5 rounded-full text-sm font-montserrat shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Loading more..." : `Load More (${safePopularAnime.length} loaded)`}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </main>{rendered !== "search" && <Footer />}</div>
  );
};

export default memo(Popular);
