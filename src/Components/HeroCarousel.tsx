import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import ProgressiveImage from "./ProgressiveImage";

interface HeroCarouselProps {
  trendingAnime?: any[];
}

const getHeroImage = (anime: any) =>
  anime?.banner_image ||
  anime?.images?.jpg?.banner_image ||
  anime?.images?.jpg?.large_image_url ||
  anime?.images?.jpg?.image_url ||
  "";

const hasWideArtwork = (anime: any) => Boolean(anime?.banner_image || anime?.images?.jpg?.banner_image);

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ trendingAnime = [] }) => {
  const slides = useMemo(() => {
    const wideSlides = trendingAnime.filter(hasWideArtwork);
    return (wideSlides.length ? wideSlides : trendingAnime).slice(0, 6);
  }, [trendingAnime]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  const showSlide = useCallback((index: number) => {
    if (!slides.length) return;
    setActiveIndex((index + slides.length) % slides.length);
  }, [slides.length]);

  const showNext = useCallback(() => showSlide(activeIndex + 1), [activeIndex, showSlide]);
  const showPrevious = useCallback(() => showSlide(activeIndex - 1), [activeIndex, showSlide]);

  useEffect(() => {
    if (slides.length < 2 || paused || isMobile) return;
    const timer = window.setInterval(showNext, 7000);
    return () => window.clearInterval(timer);
  }, [slides.length, paused, isMobile, showNext]);

  useEffect(() => {
    if (slides.length < 2) return;
    const nextImage = getHeroImage(slides[(activeIndex + 1) % slides.length]);
    if (!nextImage) return;
    const preloader = new Image();
    preloader.decoding = "async";
    preloader.src = nextImage;
  }, [activeIndex, slides]);

  if (!slides.length) {
    return (
      <section className="hero-shell hero-shell--loading" aria-label="Loading featured anime">
        <div className="hero-copy-skeleton">
          <span /><strong /><span /><p /><button />
        </div>
      </section>
    );
  }

  const anime = slides[activeIndex] || slides[0];
  const title = anime.title_english || anime.title || "Featured anime";
  const heroImage = getHeroImage(anime);

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const distance = touchStartX.current - event.changedTouches[0].clientX;
    if (Math.abs(distance) > 45) distance > 0 ? showNext() : showPrevious();
    touchStartX.current = null;
  };

  return (
    <section
      className="hero-shell"
      aria-roledescription="carousel"
      aria-label="Featured anime"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
      onTouchEnd={onTouchEnd}
    >
      <ProgressiveImage
        key={`hero-${anime.mal_id}`}
        src={heroImage}
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        wrapperClassName="hero-media"
        className="hero-media__image"
      />
      <div className="hero-shade" />

      <div className="hero-content" key={`copy-${anime.mal_id}`}>
        <h1>{title}</h1>
        <div className="hero-meta">
          {anime.score && <span className="hero-score"><Star size={14} fill="currentColor" /> {anime.score}</span>}
          {anime.type && <span>{anime.type}</span>}
          {anime.episodes && <span>{anime.episodes} episodes</span>}
          {anime.year && <span>{anime.year}</span>}
        </div>
        {anime.synopsis && <p>{anime.synopsis}</p>}
        <Link to={`/anime/${anime.mal_id}`} className="hero-action">
          <Play size={17} fill="currentColor" />
         <span>View details</span>
        </Link>
      </div>

      {slides.length > 1 && (
        <>
          <button className="hero-arrow hero-arrow--left" onClick={showPrevious} aria-label="Previous featured anime"><ChevronLeft /></button>
          <button className="hero-arrow hero-arrow--right" onClick={showNext} aria-label="Next featured anime"><ChevronRight /></button>
          <div className="hero-dots" aria-label="Choose featured anime">
            {slides.map((slide, index) => (
              <button key={slide.mal_id} aria-label={`Show ${slide.title_english || slide.title}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => showSlide(index)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default React.memo(HeroCarousel);
