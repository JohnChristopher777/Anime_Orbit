import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPopularManga } from "../services/anilist";
import SEO from "./SEO";
import Footer from "./Footer";
import { BookOpen, Star, RefreshCw, Sparkles, Filter, ArrowLeft, Home } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const Manga: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get("sort") || "POPULARITY_DESC";
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchManga = useCallback(async (targetPage: number, sort: string, append = false) => {
    try {
      if (!append) setInitialLoading(true);
      setLoading(true);
      const res = await getPopularManga(targetPage, 24, sort);
      if (append) {
        setMangaList((prev) => [...prev, ...res.media]);
      } else {
        setMangaList(res.media);
      }
      setHasNextPage(res.pageInfo?.hasNextPage || false);
    } catch (err) {
      console.error("Error fetching manga catalog:", err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchManga(1, sortParam, false);
  }, [sortParam, fetchManga]);

  const handleLoadMore = () => {
    if (!loading && hasNextPage) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchManga(nextPage, sortParam, true);
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ sort: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-white flex flex-col font-inter">
      <SEO
        title="Manga Universe - Popular Series, Origins & Story Genesis | Anime Orbit"
        description="Explore top-rated manga masterpieces, original source stories, light novels, and character genesis across all genres on Anime Orbit."
        keywords="manga database, popular manga, manga story genesis, manga origins, read manga info, Anime Orbit"
        url="https://animeorbit.web.app/manga"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-16 flex-1 w-full space-y-8">
        {/* Header Title & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ffd700]/20 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#ffd700] uppercase tracking-wider font-montserrat">
              <BookOpen size={15} />
              <span>Original Source Universe</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-staatliches tracking-wide uppercase text-white drop-shadow">
              Manga Masterpieces
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Discover foundational manga storylines, original mangaka conceptions, and adaptations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#12121a] border border-white/15 px-3 py-1.5 rounded-xl text-xs">
              <Filter size={14} className="text-[#ffd700]" />
              <select
                value={sortParam}
                onChange={handleSortChange}
                className="bg-transparent text-white font-montserrat font-bold text-xs outline-none cursor-pointer"
              >
                <option value="POPULARITY_DESC" className="bg-[#12121a]">
                  Most Popular
                </option>
                <option value="SCORE_DESC" className="bg-[#12121a]">
                  Top Rated (Highest Score)
                </option>
                <option value="START_DATE_DESC" className="bg-[#12121a]">
                  Newest Releases
                </option>
                <option value="FAVOURITES_DESC" className="bg-[#12121a]">
                  Most Favorited
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Manga Card Grid */}
        {initialLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton height={260} baseColor="#14141c" highlightColor="#222230" borderRadius={16} />
                <Skeleton height={18} width="80%" baseColor="#14141c" highlightColor="#222230" />
                <Skeleton height={14} width="40%" baseColor="#14141c" highlightColor="#222230" />
              </div>
            ))}
          </div>
        ) : mangaList.length === 0 ? (
          <div className="text-center py-24 bg-[#12121a]/80 rounded-3xl border border-white/10 space-y-4 max-w-md mx-auto">
            <BookOpen size={48} className="mx-auto text-neutral-600" />
            <h3 className="font-montserrat font-bold text-lg text-white">No Manga Found</h3>
            <p className="text-xs text-neutral-400">
              Try adjusting your filter or return to discovery.
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
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {mangaList.map((item) => {
                const img = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url;
                const title = item.title_english || item.title;

                return (
                  <Link
                    key={`manga-${item.mal_id}`}
                    to={`/manga/${item.mal_id}`}
                    className="group flex flex-col bg-[#12121a]/90 hover:bg-[#181824] border border-white/10 hover:border-[#ffd700]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 shadow-lg relative"
                  >
                    {/* Cover Artwork */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                      {img ? (
                        <img
                          src={img}
                          alt={title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                          <BookOpen size={32} />
                        </div>
                      )}

                      {/* Score Badge */}
                      {item.score && item.score !== "N/A" && (
                        <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-black/80 border border-[#ffd700]/50 text-[#ffd700] px-2 py-0.5 rounded-lg text-xs font-bold font-montserrat backdrop-blur-md shadow-md">
                          <Star size={11} fill="#ffd700" />
                          <span>{item.score}</span>
                        </div>
                      )}

                      {/* Format Badge */}
                      <span className="absolute bottom-2.5 right-2.5 bg-black/80 text-white/90 text-[10px] font-bold px-2 py-0.5 rounded-md font-montserrat uppercase border border-white/20 backdrop-blur-md">
                        {item.format || "Manga"}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="p-3.5 flex flex-col justify-between flex-1 space-y-1">
                      <h3 className="font-montserrat font-bold text-xs sm:text-sm text-white group-hover:text-[#ffd700] transition-colors line-clamp-2 leading-snug">
                        {title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 font-mono">
                        <span>{item.status}</span>
                        {item.year && <span>{item.year}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Manual Locked Load More */}
            {hasNextPage && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] disabled:opacity-50 text-black font-montserrat font-bold text-xs sm:text-sm px-8 py-3.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  <span>{loading ? "Loading More Manga..." : `Load More Manga (${mangaList.length} loaded)`}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Manga;
