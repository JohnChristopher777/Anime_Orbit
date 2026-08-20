import React, { Suspense, lazy } from "react";
import { useGlobalContext } from "../context/global";
import HeroCarousel from "./HeroCarousel";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const Popular = lazy(() => import("./Popular"));

export function Homepage() {
  const {
    search,
    popularAnime,
    searchResults,
    loading,
    topAiringAnime,
  } = useGlobalContext();

  const switchComponent = () => {
    const safeSearchResults = Array.isArray(searchResults) ? searchResults : [];
    const safePopularAnime = Array.isArray(popularAnime) ? popularAnime : [];

    // Loading skeleton state during search or initial load
    if (loading) {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-white/5 rounded-lg mb-6 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="p-3 bg-[#1e1e24] rounded-xl h-80 border border-white/5"
              >
                <Skeleton
                  height={200}
                  borderRadius={8}
                  baseColor="#141418"
                  highlightColor="#2c2c36"
                />
                <Skeleton
                  width="80%"
                  height={18}
                  baseColor="#141418"
                  highlightColor="#2c2c36"
                  className="mt-3 mb-1.5"
                />
                <Skeleton
                  width="40%"
                  height={14}
                  baseColor="#141418"
                  highlightColor="#2c2c36"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (search) {
      if (safeSearchResults.length > 0) {
        return (
          <Popular
            rendered="search"
            popularAnime={safeSearchResults}
          />
        );
      } else {
        return (
          <div className="text-center py-24 bg-neutral-900/40 max-w-2xl mx-auto rounded-2xl border border-white/5 my-8 space-y-2">
            <h3 className="font-montserrat font-bold text-lg text-white">
              No Anime Found
            </h3>
            <p className="text-neutral-400 text-sm">
              We couldn't find any results matching "{search}". Try searching with a different keyword or title!
            </p>
          </div>
        );
      }
    }

    return safePopularAnime.length > 0 ? (
      <Popular
        rendered="popular"
        popularAnime={safePopularAnime}
      />
    ) : (
      <div className="text-center py-20 text-neutral-400 text-base">
        No popular anime available yet
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col relative">
      {!search && <HeroCarousel trendingAnime={topAiringAnime} />}

      <main className={`p-4 flex-1 ${search ? "mt-24" : ""}`}>
        <Suspense
          fallback={
            <div className="text-center text-[#ffd700] text-base p-8 font-semibold">
              Loading component...
            </div>
          }
        >
          {switchComponent()}
        </Suspense>
      </main>

      <footer className="text-center p-4 bg-[#121216] text-neutral-400 text-xs w-full border-t border-white/10 mt-auto">
        <p>
          © {new Date().getFullYear()} Anime Orbit | For fair use & educational purposes only
        </p>
      </footer>
    </div>
  );
}

export default Homepage;
