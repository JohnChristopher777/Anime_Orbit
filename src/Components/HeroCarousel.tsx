import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, Star, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface HeroCarouselProps {
  trendingAnime?: any[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ trendingAnime = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const topAnime = useMemo(() => {
    return trendingAnime.slice(0, 8);
  }, [trendingAnime]);

  const count = topAnime.length;

  const handleNext = useCallback(() => {
    if (count === 0) return;
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const handlePrev = useCallback(() => {
    if (count === 0) return;
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  // 5-second automatic sliding
  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [count, isPaused, handleNext]);

  if (!topAnime.length) {
    return (
      <div className="w-full h-[75vh] max-h-[720px] min-h-[480px] relative overflow-hidden bg-[#0c0c10] flex items-center justify-between px-8 md:px-16">
        <div className="max-w-xl flex-1 space-y-4">
          <Skeleton width={180} height={28} baseColor="#1a1a22" highlightColor="#2c2c36" borderRadius={20} />
          <Skeleton width="85%" height={48} baseColor="#1a1a22" highlightColor="#2c2c36" borderRadius={8} />
          <Skeleton width="40%" height={24} baseColor="#1a1a22" highlightColor="#2c2c36" />
          <Skeleton count={3} baseColor="#1a1a22" highlightColor="#2c2c36" />
          <Skeleton width={160} height={44} borderRadius={22} baseColor="#1a1a22" highlightColor="#2c2c36" />
        </div>
        <div className="hidden lg:block w-64 h-96">
          <Skeleton height="100%" borderRadius={16} baseColor="#1a1a22" highlightColor="#2c2c36" />
        </div>
      </div>
    );
  }

  const currentAnime = topAnime[activeIndex] || topAnime[0];
  const currentTitle = currentAnime.title_english || currentAnime.title;
  const posterImg =
    currentAnime.images?.jpg?.large_image_url ||
    currentAnime.images?.jpg?.image_url ||
    "";

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full h-[80vh] max-h-[760px] min-h-[520px] relative overflow-hidden bg-[#0a0a0e] select-none"
    >
      {/* Dynamic Animated Anime Artwork Ambient Backdrop */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`hero-bg-${currentAnime.mal_id}`}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.3, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
        >
          {posterImg && (
            <img
              src={posterImg}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover filter blur-3xl scale-125 transform-gpu"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Layered Galaxy & Golden Nebula Lighting Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c10]/85 via-[#07070b]/80 to-[#101018]/85 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_80%_at_70%_20%,rgba(255,215,0,0.24),rgba(0,0,0,0))] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_75%,rgba(255,215,0,0.16),rgba(0,0,0,0))] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(255,234,0,0.08),rgba(0,0,0,0))] z-0 pointer-events-none" />

      {/* Cinematic Dark Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-[1] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-transparent z-[1] pointer-events-none" />

      {/* Hero Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto h-full flex items-center justify-between px-6 sm:px-10 lg:px-16 gap-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnime.mal_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl text-white space-y-4"
          >
            {/* Trending Rank Badge */}
            <div className="inline-flex items-center gap-2 bg-[#ffd700]/15 border border-[#ffd700]/40 text-[#ffd700] px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider backdrop-blur-md">
              <TrendingUp size={16} />
              <span>#{activeIndex + 1} Trending Title</span>
            </div>

            {/* Anime Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-staatliches tracking-wide uppercase text-white drop-shadow-2xl line-clamp-2 leading-none">
              {currentTitle}
            </h1>

            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-neutral-300">
              {currentAnime.score && (
                <div className="flex items-center gap-1.5 bg-[#ffd700]/20 border border-[#ffd700]/40 text-[#ffd700] px-2.5 py-1 rounded-md">
                  <Star size={15} fill="#ffd700" />
                  <span>{currentAnime.score}</span>
                </div>
              )}
              {currentAnime.type && (
                <span className="bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-sm">
                  {currentAnime.type}
                </span>
              )}
              {currentAnime.episodes && (
                <span className="bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-sm">
                  {currentAnime.episodes} Episodes
                </span>
              )}
              {currentAnime.year && (
                <span className="bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-sm">
                  {currentAnime.year}
                </span>
              )}
            </div>

            {/* Synopsis Overview */}
            <p className="text-neutral-300 text-sm sm:text-base line-clamp-3 leading-relaxed drop-shadow">
              {currentAnime.synopsis || "Dive into this exciting anime series and follow epic adventures and battles!"}
            </p>

            {/* Action Button */}
            <div className="pt-2 flex items-center">
              <Link
                to={`/anime/${currentAnime.mal_id}`}
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#ffd700] to-[#ffea00] text-black font-bold px-7 py-3.5 rounded-full text-sm sm:text-base hover:scale-105 hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] transition-all duration-200"
              >
                <Play size={18} fill="#000" />
                <span>Explore More</span>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Framed Anime Poster Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnime.mal_id}
            initial={{ opacity: 0, scale: 0.92, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, x: -20 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:block flex-shrink-0 w-64 h-96 rounded-2xl overflow-hidden border-2 border-[#ffd700]/50 shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative group"
          >
            <img
              src={posterImg}
              alt={currentTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <Link
                to={`/anime/${currentAnime.mal_id}`}
                className="w-full text-center bg-[#ffd700] text-black font-bold py-2 rounded-xl text-xs uppercase tracking-wider"
              >
                View Details
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Manual Left / Right Navigation Buttons */}
      <button
        onClick={handlePrev}
        aria-label="Previous Slide"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#121216]/90 border border-[#ffd700]/40 text-[#ffd700] flex items-center justify-center hover:bg-[#ffd700] hover:text-black hover:scale-110 shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all cursor-pointer"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next Slide"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#121216]/90 border border-[#ffd700]/40 text-[#ffd700] flex items-center justify-center hover:bg-[#ffd700] hover:text-black hover:scale-110 shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all cursor-pointer"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide Indicators Dots */}
      <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center items-center gap-2">
        {topAnime.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIndex
                ? "w-7 bg-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.8)]"
                : "w-2 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
