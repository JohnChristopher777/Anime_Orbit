import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  Share2,
  GitBranch,
  Hash,
  ListOrdered,
  Heart,
} from "lucide-react";
import ProgressiveImage from "./ProgressiveImage";
import { toast } from "react-toastify";
import { useWatchlist } from "../context/WatchlistContext";
import AppDropdown from "./AppDropdown";
import { useFavourites } from "../context/FavouritesContext";

export const MangaDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manga, setManga] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [trackerBusy, setTrackerBusy] = useState(false);
  const [chapterPage, setChapterPage] = useState(1);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [progressSaving, setProgressSaving] = useState(false);
  const { mangaWatchlist, addMangaToWatchlist, removeMangaFromWatchlist, updateMangaWatchlistEntry } = useWatchlist();
  const { addMangaToFavourites, removeMangaFromFavourites, isMangaFavourite } = useFavourites();
  const trackedMangaEntry = mangaWatchlist.find((item) => item.mal_id === Number(id));

  useEffect(() => {
    setChapterProgress(Number(trackedMangaEntry?.progress || 0));
  }, [trackedMangaEntry?.mal_id, trackedMangaEntry?.progress]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [lightboxOpen]);

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

  const handleShare = async () => {
    if (!manga) return;
    const summary = (manga.synopsis || "").replace(/<[^>]+>/g, "").slice(0, 180);
    const shareData = {
      title: `${manga.title} | Anime Orbit`,
      text: `${manga.title}${manga.score ? ` • ${manga.score}/10` : ""}${manga.format ? ` • ${manga.format}` : ""}\n${summary}${summary ? "…" : ""}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success("Manga link copied");
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") toast.error("Could not share this manga");
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
            We couldn't load this manga right now. Please try again shortly.
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
  const trackedManga = mangaWatchlist.find((item) => item.mal_id === manga.mal_id);
  const isInMangaWatchlist = Boolean(trackedManga);
  const isFavoriteManga = isMangaFavourite(manga.mal_id);

  const handleTrackerStatus = async (status: string) => {
    setTrackerBusy(true);
    try {
      if (status === "remove") {
        await removeMangaFromWatchlist(manga.mal_id);
      } else {
        if (!isInMangaWatchlist) await addMangaToWatchlist(manga);
        await updateMangaWatchlistEntry(manga.mal_id, { status, ...(status === "Completed" && manga.chapters ? { progress: manga.chapters } : {}) });
      }
    } finally {
      setTrackerBusy(false);
    }
  };

  const saveChapterProgress = async (nextProgress: number) => {
    if (!trackedManga) return;
    const normalized = Math.max(0, Math.min(Number(manga.chapters || Infinity), nextProgress));
    setChapterProgress(normalized);
    setProgressSaving(true);
    try {
      await updateMangaWatchlistEntry(manga.mal_id, { status: trackedManga.status, progress: normalized });
    } finally {
      setProgressSaving(false);
    }
  };

  const formatMediaDate = (date: any) => {
    if (!date?.year) return "Not announced";
    return new Date(date.year, Math.max(0, (date.month || 1) - 1), date.day || 1).toLocaleDateString("en-US", { year: "numeric", month: "short", day: date.day ? "numeric" : undefined });
  };

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
  const knownChapterCount = typeof manga.chapters === "number" ? manga.chapters : 0;
  const chapterPageSize = 24;
  const chapterPageCount = Math.max(1, Math.ceil(knownChapterCount / chapterPageSize));
  const chapterStart = (chapterPage - 1) * chapterPageSize + 1;
  const visibleChapters = knownChapterCount
    ? Array.from({ length: Math.min(chapterPageSize, knownChapterCount - chapterStart + 1) }, (_, index) => chapterStart + index)
    : [];

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
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-8 pb-4 w-full relative z-20 flex items-center">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 bg-[#12121a]/80 hover:bg-[#ffd700] text-neutral-300 hover:text-black border border-white/15 px-4 py-2 rounded-full text-xs font-montserrat font-bold transition-all shadow-md cursor-pointer hover:scale-105 backdrop-blur-md"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Hero Banner with Ambient Lighting */}
      <div className="manga-detail-hero relative w-full h-[320px] sm:h-[380px] md:h-[460px] max-w-7xl mx-auto px-3 sm:px-8 mb-6 sm:mb-10">
        <div className="relative w-full h-full rounded-3xl overflow-hidden border border-[#ffd700]/30 shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-[#12121a]">
          {bannerImg && (
            <ProgressiveImage
              src={bannerImg}
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              wrapperClassName="w-full h-full"
              className="w-full h-full object-cover contrast-110 brightness-[.6]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0e] via-[#0a0a0e]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />

          {/* Hero Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col justify-end space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 bg-[#ffd700]/20 border border-[#ffd700]/50 text-[#ffd700] text-xs font-bold uppercase font-montserrat px-3 py-1 rounded-full w-fit backdrop-blur-md shadow-sm">
              <BookOpen size={13} />
              <span>Manga</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-staatliches uppercase tracking-wide text-white drop-shadow-2xl leading-tight">
              {manga.title}
            </h1>
            {manga.title_japanese && (
              <p className="text-sm sm:text-base text-neutral-400 font-sans font-medium">
                {manga.title_japanese}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">{manga.status}</span>
              <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-neutral-200">Started {formatMediaDate(manga.startDate)}</span>
              <span className="rounded-full border border-[#ffd700]/30 bg-[#ffd700]/10 px-2.5 py-1 text-[#ffd700]">{knownChapterCount ? `${knownChapterCount} chapters` : "Chapter count pending"}</span>
            </div>
          </div>
        </div>
      </div>

      {trackedManga && (
        <div className="mx-auto mb-6 w-full max-w-7xl px-3 sm:px-8">
          <div className="media-progress" aria-label="Your chapter progress">
            <div className="media-progress__heading"><span>Your reading progress</span><strong>{chapterProgress} / {manga.chapters || "?"} chapters</strong></div>
            {manga.chapters ? (
              <input
                className="media-progress__slider"
                aria-label={`Chapter progress: ${chapterProgress} of ${manga.chapters}`}
                type="range"
                min={0}
                max={manga.chapters}
                step={1}
                value={chapterProgress}
                style={{ "--progress": `${Math.min(100, (chapterProgress / manga.chapters) * 100)}%` } as React.CSSProperties}
                onChange={(event) => setChapterProgress(Number(event.target.value))}
                onPointerUp={() => void saveChapterProgress(chapterProgress)}
                onKeyUp={() => void saveChapterProgress(chapterProgress)}
                onBlur={() => void saveChapterProgress(chapterProgress)}
              />
            ) : <div className="media-progress__bar is-unknown" aria-label="Chapter total is not available" />}
            <div className="media-progress__controls">
              <button type="button" disabled={progressSaving || chapterProgress <= 0} onClick={() => void saveChapterProgress(chapterProgress - 1)}>−</button>
              <input aria-label="Chapter progress" type="number" min={0} max={manga.chapters || undefined} value={chapterProgress} onChange={(event) => setChapterProgress(Math.max(0, Number(event.target.value) || 0))} onBlur={() => void saveChapterProgress(chapterProgress)} />
              <button type="button" disabled={progressSaving || Boolean(manga.chapters && chapterProgress >= manga.chapters)} onClick={() => void saveChapterProgress(chapterProgress + 1)}>+</button>
              <span>{progressSaving ? "Saving…" : trackedManga.status || "Reading"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="manga-detail-layout max-w-7xl mx-auto px-3 sm:px-8 pb-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-10">
        {/* Left Column: Poster & Quick Meta */}
        <div className="lg:col-span-4 space-y-6">
          <div className="manga-detail-poster relative mx-auto w-full max-w-[250px] lg:max-w-none rounded-2xl overflow-hidden border-2 border-[#ffd700]/50 shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-neutral-900 group">
            {posterImg && (
              <ProgressiveImage
                src={posterImg}
                alt={manga.title}
                loading="eager"
                wrapperClassName="w-full aspect-[2/3]"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
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

          <div className="manga-detail-actions grid grid-cols-2 gap-2">
            <AppDropdown disabled={trackerBusy} ariaLabel="Set manga reading status" className="col-span-2 w-full" value={trackedManga?.status || ""} placeholder={trackerBusy ? "Saving..." : "Add to list"} onChange={handleTrackerStatus} options={[{ value: "Plan to Read", label: "Plan to Read" }, { value: "Reading", label: "Reading" }, { value: "Caught Up", label: "Caught Up" }, { value: "Completed", label: "Completed" }, { value: "On-Hold", label: "On Hold" }, { value: "Dropped", label: "Dropped" }, ...(isInMangaWatchlist ? [{ value: "remove", label: "Remove from list", tone: "danger" as const }] : [])]} />
            <button onClick={handleShare} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-[11px] font-bold text-white transition-colors hover:border-[#ffd700]/60 hover:text-[#ffd700]"><Share2 size={14} /><span>Share</span></button>
            <button type="button" aria-pressed={isFavoriteManga} onClick={() => isFavoriteManga ? removeMangaFromFavourites(manga.mal_id) : addMangaToFavourites(manga)} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-bold ${isFavoriteManga ? "border-rose-400/60 bg-rose-400/15 text-rose-300" : "border-white/15 bg-white/5 text-white hover:border-rose-400/50 hover:text-rose-300"}`}><Heart size={14} fill={isFavoriteManga ? "currentColor" : "none"} /><span>Favorite</span></button>
            <Link to={`/franchise/${manga.mal_id}`} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-[11px] font-bold text-white hover:border-[#ffd700]/60 hover:text-[#ffd700]"><GitBranch size={14} /><span>Franchise guide</span></Link>
          </div>

          {/* Key Facts Card */}
          <div className="bg-[#12121a]/95 border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-xl">
            <h3 className="font-montserrat font-bold text-xs uppercase tracking-wider text-[#ffd700] pb-2 border-b border-white/10 flex items-center gap-2">
              <Sparkles size={14} />
              <span>Manga details</span>
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
              <div>
                <span className="text-neutral-400 block text-[11px]">Started</span>
                <span className="font-semibold text-white pt-0.5 block">{formatMediaDate(manga.startDate)}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Ended</span>
                <span className="font-semibold text-white pt-0.5 block">{manga.endDate?.year ? formatMediaDate(manga.endDate) : manga.status === "Currently Publishing" ? "Still publishing" : "Not announced"}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Latest listed chapter</span>
                <span className="font-semibold text-white pt-0.5 block">{typeof manga.chapters === "number" ? `Chapter ${manga.chapters}` : "Not reported"}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Based on</span>
                <span className="font-semibold text-white pt-0.5 block">{String(manga.source || "Original").replace(/_/g, " ")}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Readers</span>
                <span className="font-semibold text-white pt-0.5 block">{Number(manga.popularity || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Record updated</span>
                <span className="font-semibold text-white pt-0.5 block">{manga.updatedAt ? new Date(manga.updatedAt * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Not available"}</span>
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
                  About the manga
                </h2>
                <p className="text-xs text-neutral-400">
                  Creator and publication details for this series.
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
                  Creator credits
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
              <span>Story</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {manga.synopsis || "No detailed synopsis available for this manga entry."}
            </p>
          </div>

          <section className="manga-chapter-guide" aria-labelledby="manga-chapters-title">
            <div className="manga-chapter-guide__header">
              <div><span><ListOrdered size={13} /> Chapter guide</span><h2 id="manga-chapters-title">Published chapters</h2><p>AniList supplies the chapter count, but not individual official chapter titles or summaries. Missing names are shown honestly instead of being invented.</p></div>
              {knownChapterCount > 0 && <strong>{knownChapterCount}</strong>}
            </div>
            {visibleChapters.length > 0 ? <>
              <div className="manga-chapter-guide__grid">
                {visibleChapters.map((chapter) => <article key={chapter} className={chapter === knownChapterCount ? "is-latest" : ""}>
                  <span><Hash size={12} />{chapter}</span><div><h3>Chapter {chapter}</h3><p>{chapter === knownChapterCount ? "Latest chapter recorded by AniList" : "Official chapter title not supplied"}</p></div>
                </article>)}
              </div>
              {chapterPageCount > 1 && <div className="manga-chapter-guide__pager"><button disabled={chapterPage === 1} onClick={() => setChapterPage((page) => Math.max(1, page - 1))}><ChevronLeft size={14} /> Previous</button><span>Page {chapterPage} of {chapterPageCount}</span><button disabled={chapterPage === chapterPageCount} onClick={() => setChapterPage((page) => Math.min(chapterPageCount, page + 1))}>Next <ChevronRight size={14} /></button></div>}
            </> : <div className="manga-chapter-guide__empty">This publishing entry does not have a confirmed chapter total yet.</div>}
          </section>

          {/* Related Anime Adaptations (Clickable Link Back to AnimeItem) */}
          {animeAdaptations.length > 0 && (
            <div className="bg-[#12121a]/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h2 className="text-lg font-bold font-montserrat text-white flex items-center gap-2">
                <Tv size={18} className="text-[#ffd700]" />
                <span>Anime adaptations</span>
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
                        <ProgressiveImage
                          src={animeCover}
                          alt={animeTitle}
                          wrapperClassName="w-14 h-20 rounded-xl border border-white/10 flex-shrink-0"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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
                      <ProgressiveImage
                        src={char.node.image.large}
                        alt={char.node?.name?.full}
                        wrapperClassName="w-16 h-16 rounded-full mx-auto border border-white/10"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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
      {lightboxOpen && gallerySlides.length > 0 && createPortal(
        <div className="fixed inset-0 z-[4000] bg-black/95 flex items-center justify-center px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]" role="dialog" aria-modal="true" aria-label="Manga artwork gallery">
          <button
            onClick={() => setLightboxOpen(false)}
            className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 sm:right-6 grid h-11 w-11 place-items-center text-white hover:text-black rounded-full bg-[#202026] hover:bg-[#ffd700] border border-white/20 transition-colors z-[4010] cursor-pointer shadow-xl"
            aria-label="Close artwork gallery"
          >
            <X size={22} />
          </button>

          {gallerySlides.length > 1 && (
            <button
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev === 0 ? gallerySlides.length - 1 : prev - 1
                )
              }
              className="fixed left-3 sm:left-6 text-white hover:text-black p-2 sm:p-3 rounded-full bg-[#202026] hover:bg-[#ffd700] border border-white/15 transition-colors z-[4005] cursor-pointer"
              aria-label="Previous artwork"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <div className="w-full max-w-5xl h-full max-h-[calc(100dvh-2rem)] flex flex-col items-center justify-center pt-12 pb-3">
            <img
              src={gallerySlides[lightboxIndex]?.src}
              alt="Manga Artwork Gallery"
              className="max-w-full max-h-[calc(100dvh-7rem)] object-contain rounded-xl border border-white/20 shadow-2xl"
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
              className="fixed right-3 sm:right-6 text-white hover:text-black p-2 sm:p-3 rounded-full bg-[#202026] hover:bg-[#ffd700] border border-white/15 transition-colors z-[4005] cursor-pointer"
              aria-label="Next artwork"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>,
        document.body
      )}

      <Footer />
    </div>
  );
};

export default MangaDetails;
