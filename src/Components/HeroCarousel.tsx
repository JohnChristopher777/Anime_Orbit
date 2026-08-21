import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Star, TrendingUp, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface HeroCarouselProps {
  trendingAnime?: any[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ trendingAnime = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

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

  // Touch swipe support for mobile and tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

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
      <div className="w-full min-h-[460px] sm:min-h-[520px] md:min-h-[580px] lg:h-[80vh] lg:max-h-[740px] pt-[75px] pb-12 relative overflow-hidden bg-[#0c0c10] flex items-center justify-between px-6 sm:px-12 md:px-20">
        <div className="max-w-xl flex-1 space-y-4">
          <Skeleton width={180} height={28} baseColor="#1a1a22" highlightColor="#2c2c36" borderRadius={20} />
          <Skeleton width="85%" height={48} baseColor="#1a1a22" highlightColor="#2c2c36" borderRadius={8} />
          <Skeleton width="40%" height={24} baseColor="#1a1a22" highlightColor="#2c2c36" />
          <Skeleton count={3} baseColor="#1a1a22" highlightColor="#2c2c36" />
          <Skeleton width={160} height={44} borderRadius={22} baseColor="#1a1a22" highlightColor="#2c2c36" />
        </div>
        <div className="hidden md:block w-52 h-76 lg:w-64 lg:h-96">
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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full min-h-[500px] sm:min-h-[540px] md:min-h-[580px] lg:h-[84vh] lg:max-h-[780px] pt-[92px] sm:pt-[100px] md:pt-[108px] pb-12 relative overflow-hidden bg-[#0a0a0e] select-none flex items-center"
    >
      {/* Dynamic Animated Anime Artwork Ambient Backdrop */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`hero-bg-${currentAnime.mal_id}`}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.5, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
        >
          {posterImg && (
            <img
              src={posterImg}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover filter blur-2xl sm:blur-3xl scale-125 transform-gpu"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Layered Golden Nebula Lighting Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_80%_at_70%_20%,rgba(255,215,0,0.18),rgba(0,0,0,0))] z-0 pointer-events-none" />

      {/* Mobile-Exclusive Full-Screen Crisp Background Artwork Layer (Screen < md) */}
      <div className="md:hidden absolute inset-0 z-[2] pointer-events-none overflow-hidden select-none">
        {posterImg && (
          <img
            src={posterImg}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-top opacity-80 filter contrast-115 brightness-90"
          />
        )}
        {/* Soft Vignette Overlays for High-Contrast Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0e] via-[#0a0a0e]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
      </div>

      {/* Cinematic Dark Gradient for Desktop */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#0a0a0e]/98 via-[#0a0a0e]/75 to-transparent z-[3] pointer-events-none" />
      <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-[#0a0a0e] via-transparent to-[#0a0a0e]/60 z-[3] pointer-events-none" />

      {/* Hero Content Container with Safe Padding to Prevent Arrow Collisions */}
      <div className="relative z-10 max-w-7xl mx-auto w-full h-full flex flex-col md:flex-row items-center justify-between px-12 sm:px-16 md:px-20 lg:px-24 gap-6 md:gap-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnime.mal_id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="flex-1 max-w-2xl text-white space-y-3 sm:space-y-4 w-full"
          >
            {/* Top Row: Rank Badge */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 bg-[#ffd700]/15 border border-[#ffd700]/40 text-[#ffd700] px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider backdrop-blur-md shadow-md">
                <TrendingUp size={14} />
                <span>#{activeIndex + 1} Trending</span>
              </div>
            </div>

            {/* Anime Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-staatliches tracking-wide uppercase text-white drop-shadow-2xl line-clamp-2 leading-none">
              {currentTitle}
            </h1>

            {/* Metadata Tags Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-semibold text-neutral-300">
              {currentAnime.score && (
                <div className="flex items-center gap-1 bg-[#ffd700]/20 border border-[#ffd700]/40 text-[#ffd700] px-2.5 py-0.5 sm:py-1 rounded-md">
                  <Star size={13} fill="#ffd700" />
                  <span>{currentAnime.score}</span>
                </div>
              )}
              {currentAnime.type && (
                <span className="bg-white/10 px-2.5 py-0.5 sm:py-1 rounded-md backdrop-blur-sm">
                  {currentAnime.type}
                </span>
              )}
              {currentAnime.episodes && (
                <span className="bg-white/10 px-2.5 py-0.5 sm:py-1 rounded-md backdrop-blur-sm">
                  {currentAnime.episodes} Eps
                </span>
              )}
              {currentAnime.year && (
                <span className="bg-white/10 px-2.5 py-0.5 sm:py-1 rounded-md backdrop-blur-sm">
                  {currentAnime.year}
                </span>
              )}
            </div>

            {/* Synopsis Overview */}
            <p className="text-neutral-300 text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-xl">
              {currentAnime.synopsis || "Dive into this exciting anime series and follow epic adventures and battles!"}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <Link
                to={`/anime/${currentAnime.mal_id}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ffd700] to-[#ffea00] text-black font-bold px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm md:text-base hover:scale-105 hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] transition-all duration-200 cursor-pointer shadow-lg"
              >
                <Play size={16} fill="#000" />
                <span>Explore Details</span>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Framed Anime Full-Height Rectangular Poster Card (Desktop & Tablets) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnime.mal_id}
            initial={{ opacity: 0, scale: 0.92, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, x: -20 }}
            transition={{ duration: 0.35 }}
            className="hidden md:block flex-shrink-0 w-56 h-[345px] lg:w-64 lg:h-[405px] xl:w-72 xl:h-[450px] my-3 lg:my-4 rounded-2xl overflow-hidden border-2 border-[#ffd700]/60 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_25px_rgba(255,215,0,0.2)] relative group"
          >
            <img
              src={posterImg}
              alt={currentTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
              <Link
                to={`/anime/${currentAnime.mal_id}`}
                className="w-full text-center bg-[#ffd700] text-black font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
              >
                View Anime Details
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Manual Left Navigation Button (Safely Positioned in Left Margin) */}
      <button
        onClick={handlePrev}
        aria-label="Previous Slide"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#121216]/90 border border-[#ffd700]/40 text-[#ffd700] flex items-center justify-center hover:bg-[#ffd700] hover:text-black hover:scale-110 shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all cursor-pointer"
      >
        <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
      </button>

      {/* Manual Right Navigation Button (Safely Positioned in Right Margin) */}
      <button
        onClick={handleNext}
        aria-label="Next Slide"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#121216]/90 border border-[#ffd700]/40 text-[#ffd700] flex items-center justify-center hover:bg-[#ffd700] hover:text-black hover:scale-110 shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all cursor-pointer"
      >
        <ChevronRight size={18} className="sm:w-5 sm:h-5" />
      </button>

      {/* Slide Indicators Dots */}
      <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-20 flex justify-center items-center gap-1.5 sm:gap-2">
        {topAnime.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIndex
                ? "w-6 sm:w-8 bg-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.8)]"
                : "w-1.5 sm:w-2 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
