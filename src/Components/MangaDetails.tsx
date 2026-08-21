import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMangaDetailsCombined } from "../services/anilist";
import SEO from "./SEO";
import Footer from "./Footer";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  BookOpen,
  Star,
  Layers,
  Calendar,
  Sparkles,
  ArrowLeft,
  User,
  ExternalLink,
  Tv,
  Image as ImageIcon,
  Flame,
  Award,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const MangaDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manga, setManga] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, behavior: "smooth" });

    const fetchManga = async () => {
      setLoading(true);
      try {
        const data = await getMangaDetailsCombined(id);
        setManga(data);
      } catch (err) {
        console.error("Error loading manga details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0e] text-white font-inter px-4 sm:px-8 py-24 max-w-7xl mx-auto space-y-8">
        <Skeleton height={380} baseColor="#14141c" highlightColor="#222230" borderRadius={24} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton height={420} baseColor="#14141c" highlightColor="#222230" borderRadius={20} />
          <div className="md:col-span-2 space-y-4">
            <Skeleton height={40} width="70%" baseColor="#14141c" highlightColor="#222230" />
            <Skeleton count={6} height={20} baseColor="#14141c" highlightColor="#222230" />
          </div>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-[#0a0a0e] text-white font-inter flex flex-col">
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-4 flex-1">
          <BookOpen size={56} className="mx-auto text-neutral-600" />
          <h2 className="text-2xl font-bold font-montserrat text-white">Manga Details Not Found</h2>
          <p className="text-xs text-neutral-400">
            We couldn't retrieve metadata for this manga title from AniList.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 bg-[#ffd700] text-black font-bold px-6 py-2 rounded-full text-xs font-montserrat shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const posterImg = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url;
  const bannerImg = manga.bannerImage || posterImg;

  // Compile artwork for lightbox
  const gallerySlides = [
    { src: posterImg },
    ...(manga.bannerImage ? [{ src: manga.bannerImage }] : []),
    ...(manga.characters || [])
      .filter((c: any) => c.node?.image?.large)
      .slice(0, 8)
      .map((c: any) => ({ src: c.node.image.large })),
  ].filter((s) => s.src);

  const animeAdaptations = (manga.relations || []).filter(
    (r: any) => r.node?.type === "ANIME"
  );

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white font-inter flex flex-col overflow-x-hidden">
      <SEO
        title={`${manga.title} - Manga Origins, Story & Chapters | Anime Orbit`}
        description={`${manga.title}: ${manga.synopsis?.slice(0, 150)}...`}
        keywords={`${manga.title}, manga adaptation, manga chapters, original manga story, Anime Orbit`}
        image={posterImg}
        url={`https://animeorbit.web.app/manga/${id}`}
      />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-4 w-full relative z-20">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 bg-[#12121a]/80 hover:bg-[#ffd700] text-neutral-300 hover:text-black border border-white/15 px-4 py-2 rounded-full text-xs font-montserrat font-bold transition-all shadow-md cursor-pointer hover:scale-105 backdrop-blur-md"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Hero Banner with Ambient Lighting */}
      <div className="relative w-full min-h-[380px] md:h-[460px] max-w-7xl mx-auto px-4 sm:px-8 mb-10">
        <div className="relative w-full h-full rounded-3xl overflow-hidden border border-[#ffd700]/30 shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-[#12121a]">
          {bannerImg && (
            <img
              src={bannerImg}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover filter contrast-110 brightness-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0e] via-[#0a0a0e]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />

          {/* Hero Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col justify-end space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 bg-[#ffd700]/20 border border-[#ffd700]/50 text-[#ffd700] text-xs font-bold uppercase font-montserrat px-3 py-1 rounded-full w-fit backdrop-blur-md shadow-sm">
              <BookOpen size={13} />
              <span>Original Source Manga</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-staatliches uppercase tracking-wide text-white drop-shadow-2xl leading-tight">
              {manga.title}
            </h1>
            {manga.title_japanese && (
              <p className="text-sm sm:text-base text-neutral-400 font-sans font-medium">
                {manga.title_japanese}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
        {/* Left Column: Poster & Quick Meta */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative rounded-2xl overflow-hidden border-2 border-[#ffd700]/50 shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-neutral-900 group">
            {posterImg && (
              <img
                src={posterImg}
                alt={manga.title}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                onClick={() => {
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
              />
            )}
            <button
              onClick={() => {
                setLightboxIndex(0);
                setLightboxOpen(true);
              }}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-black/80 hover:bg-[#ffd700] text-white hover:text-black border border-white/20 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-lg"
            >
              <ImageIcon size={13} />
              <span>View Gallery</span>
            </button>
          </div>

          {/* Key Facts Card */}
          <div className="bg-[#12121a]/95 border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-xl">
            <h3 className="font-montserrat font-bold text-xs uppercase tracking-wider text-[#ffd700] pb-2 border-b border-white/10 flex items-center gap-2">
              <Sparkles size={14} />
              <span>Publication Metadata</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-neutral-400 block text-[11px]">Score</span>
                <span className="font-bold text-[#ffd700] flex items-center gap-1 text-sm pt-0.5">
                  <Star size={13} fill="#ffd700" />
                  <span>{manga.score} / 10</span>
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Status</span>
                <span className="font-semibold text-white pt-0.5 block">{manga.status}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Total Chapters</span>
                <span className="font-semibold text-white pt-0.5 block">{manga.chapters}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Total Volumes</span>
                <span className="font-semibold text-white pt-0.5 block">{manga.volumes}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Format</span>
                <span className="font-semibold text-white pt-0.5 block">{manga.format}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Origin</span>
                <span className="font-semibold text-white pt-0.5 block">{manga.countryOfOrigin}</span>
              </div>
            </div>

            {/* Genres Tag Cloud */}
            <div className="pt-2">
              <span className="text-neutral-400 block text-[11px] mb-2">Genres</span>
              <div className="flex flex-wrap gap-1.5">
                {(manga.genres || []).map((genre: string) => (
                  <Link
                    key={genre}
                    to={`/genres?genre=${encodeURIComponent(genre)}`}
                    className="bg-[#ffd700]/10 hover:bg-[#ffd700] text-[#ffd700] hover:text-black border border-[#ffd700]/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: How The Story Was Born, Synopsis, Adaptations & Characters */}
        <div className="lg:col-span-8 space-y-8">
          {/* SPECIAL SECTION: How the Story Was Born / Origins & Creation */}
          <div className="relative bg-gradient-to-br from-[#1c1810] via-[#14141c] to-[#0e0e14] border-2 border-[#ffd700]/50 rounded-3xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(255,215,0,0.15)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ffd700]/20 border border-[#ffd700] flex items-center justify-center text-[#ffd700]">
                <Flame size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black font-montserrat text-[#ffd700]">
                  How the Story Was Born: Genesis & Concept
                </h2>
                <p className="text-xs text-neutral-400">
                  The origins, author inspiration, and foundation of this manga universe.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed pt-1">
              {manga.background}
            </p>

            {/* Author & Creator Credits */}
            {manga.staff && manga.staff.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <span className="text-xs font-bold font-montserrat text-[#ffd700] uppercase tracking-wider block mb-2">
                  Original Creative Staff & Mangaka
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {manga.staff.slice(0, 4).map((s: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2"
                    >
                      <User size={13} className="text-[#ffd700]" />
                      <span className="font-bold text-white">{s.node?.name?.full}</span>
                      <span className="text-neutral-400 text-[11px]">({s.role})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Synopsis Section */}
          <div className="bg-[#12121a]/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
            <h2 className="text-lg font-bold font-montserrat text-white flex items-center gap-2">
              <Layers size={18} className="text-[#ffd700]" />
              <span>Plot Synopsis & Narrative</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {manga.synopsis || "No detailed synopsis available for this manga entry."}
            </p>
          </div>

          {/* Related Anime Adaptations (Clickable Link Back to AnimeItem) */}
          {animeAdaptations.length > 0 && (
            <div className="bg-[#12121a]/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h2 className="text-lg font-bold font-montserrat text-white flex items-center gap-2">
                <Tv size={18} className="text-[#ffd700]" />
                <span>Anime Adaptations of this Story</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {animeAdaptations.map((rel: any, idx: number) => {
                  const animeId = rel.node?.id;
                  const animeTitle = rel.node?.title?.english || rel.node?.title?.romaji;
                  const animeCover = rel.node?.coverImage?.large;

                  return (
                    <Link
                      key={idx}
                      to={`/anime/${animeId}`}
                      className="flex items-center gap-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#ffd700]/50 p-3 rounded-2xl transition-all duration-200 group shadow-md"
                    >
                      {animeCover && (
                        <img
                          src={animeCover}
                          alt={animeTitle}
                          className="w-14 h-20 object-cover rounded-xl border border-white/10 flex-shrink-0 group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="min-w-0 space-y-1">
                        <span className="text-[10px] font-bold uppercase bg-[#ffd700]/15 text-[#ffd700] px-2 py-0.5 rounded-md font-montserrat">
                          {rel.relationType || "Anime Adaptation"}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#ffd700] transition-colors truncate">
                          {animeTitle}
                        </h4>
                        <span className="text-[11px] text-neutral-400 block">
                          Format: {rel.node?.format || "TV Series"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Characters */}
          {manga.characters && manga.characters.length > 0 && (
            <div className="bg-[#12121a]/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h2 className="text-lg font-bold font-montserrat text-white flex items-center gap-2">
                <User size={18} className="text-[#ffd700]" />
                <span>Notable Characters</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {manga.characters.slice(0, 8).map((char: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center space-y-2 group hover:border-[#ffd700]/40 transition-colors"
                  >
                    {char.node?.image?.large && (
                      <img
                        src={char.node.image.large}
                        alt={char.node?.name?.full}
                        className="w-16 h-16 rounded-full mx-auto object-cover border border-white/10 group-hover:scale-105 transition-transform"
                      />
                    )}
                    <p className="text-xs font-bold text-white truncate">
                      {char.node?.name?.full}
                    </p>
                    <span className="text-[10px] text-neutral-400 block font-mono">
                      {char.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Artwork Lightbox Modal */}
      {lightboxOpen && gallerySlides.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-[#ffd700] p-2 rounded-full bg-black/50 transition-colors z-50 cursor-pointer"
          >
            <X size={28} />
          </button>

          {gallerySlides.length > 1 && (
            <button
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev === 0 ? gallerySlides.length - 1 : prev - 1
                )
              }
              className="absolute left-6 text-white hover:text-[#ffd700] p-3 rounded-full bg-black/50 transition-colors z-50 cursor-pointer"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center">
            <img
              src={gallerySlides[lightboxIndex]?.src}
              alt="Manga Artwork Gallery"
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-white/20 shadow-2xl"
            />
            <p className="text-xs text-neutral-400 mt-3 font-mono">
              Artwork {lightboxIndex + 1} of {gallerySlides.length}
            </p>
          </div>

          {gallerySlides.length > 1 && (
            <button
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev === gallerySlides.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-6 text-white hover:text-[#ffd700] p-3 rounded-full bg-black/50 transition-colors z-50 cursor-pointer"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MangaDetails;
