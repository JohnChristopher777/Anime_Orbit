import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getAnimeDetailsCombined, getAnimeCharacters, getAnimeStaff } from "../services/anilist";
import { useFavourites } from "../context/FavouritesContext";
import { useWatchlist } from "../context/WatchlistContext";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";
import SEO from "./SEO";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import {
  Star,
  Heart,
  Bookmark,
  Share2,
  Play,
  ArrowLeft,
  Calendar,
  Tv,
  Award,
  ExternalLink,
  Film,
  UserCheck,
  ChevronDown,
  Image as ImageIcon,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { sanitizeInput, checkRateLimit } from "../utils/security";

export const AnimeItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Anime Data State
  const [anime, setAnime] = useState<any>({});
  const [characters, setCharacters] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [visibleCharCount, setVisibleCharCount] = useState(24);
  const [visibleStaffCount, setVisibleStaffCount] = useState(16);
  const [charPage, setCharPage] = useState(1);
  const [hasMoreChars, setHasMoreChars] = useState(true);
  const [loadingMoreChars, setLoadingMoreChars] = useState(false);
  const [staffPage, setStaffPage] = useState(1);
  const [hasMoreStaff, setHasMoreStaff] = useState(true);
  const [loadingMoreStaff, setLoadingMoreStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [charSearch, setCharSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showMore, setShowMore] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Discussion Comments State & Spoiler Safety
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentSpoiler, setIsCommentSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(10);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [trailerLoaded, setTrailerLoaded] = useState(false);
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const { currentUser } = useAuth();
  const { updateAnimeStatus, getAnimeStatus } = useWatchlist();

  const {
    title,
    title_english,
    title_japanese,
    synopsis,
    trailer,
    duration,
    images,
    rank,
    score,
    status,
    genres,
    studios,
    producers,
    source,
    type,
    episodes: totalEpisodes,
    mal_id,
    year,
  } = anime || {};

  const displayTitle = title_english || title || "Anime Details";

  const isFav = mal_id ? isFavourite(mal_id) : false;
  const currentStatus = mal_id ? getAnimeStatus(mal_id) : null;

  // Fetch anime data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!id) return;
      setLoading(true);
      setCharPage(1);
      setHasMoreChars(true);
      setStaffPage(1);
      setHasMoreStaff(true);
      setVisibleCharCount(24);
      setVisibleStaffCount(16);
      try {
        const data = await getAnimeDetailsCombined(parseInt(id, 10));
        setAnime(data.anime || {});
        setCharacters(data.characters || []);
        setEpisodes(data.episodes || []);
        setRelations(data.relations || []);
        setStaff(data.staff || []);
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  // Auto-fetch all remaining character pages when user searches
  useEffect(() => {
    if (!charSearch.trim() || !id || !hasMoreChars || loadingMoreChars) return;
    const fetchRemainingCharacters = async () => {
      try {
        let cur = charPage;
        let more = true;
        while (more && cur < 12) {
          const next = cur + 1;
          const res = await getAnimeCharacters(parseInt(id, 10), next, 25);
          if (res.characters && res.characters.length > 0) {
            setCharacters((prev) => [...prev, ...res.characters]);
            cur = next;
            more = res.pageInfo?.hasNextPage ?? false;
          } else {
            more = false;
          }
        }
        setCharPage(cur);
        setHasMoreChars(more);
      } catch {
        // Handled
      }
    };
    fetchRemainingCharacters();
  }, [charSearch, id, hasMoreChars, charPage, loadingMoreChars]);

  const loadMoreCharacters = async () => {
    if (!id || loadingMoreChars) return;
    if (visibleCharCount < characters.length) {
      setVisibleCharCount((prev) => prev + 24);
      return;
    }
    if (!hasMoreChars) return;
    setLoadingMoreChars(true);
    try {
      const nextPage = charPage + 1;
      const res = await getAnimeCharacters(parseInt(id, 10), nextPage, 25);
      if (res.characters && res.characters.length > 0) {
        setCharacters((prev) => [...prev, ...res.characters]);
        setCharPage(nextPage);
        setVisibleCharCount((prev) => prev + res.characters.length);
        setHasMoreChars(res.pageInfo?.hasNextPage ?? false);
      } else {
        setHasMoreChars(false);
      }
    } catch {
      setHasMoreChars(false);
    } finally {
      setLoadingMoreChars(false);
    }
  };

  const loadMoreStaff = async () => {
    if (!id || loadingMoreStaff) return;
    if (visibleStaffCount < staff.length) {
      setVisibleStaffCount((prev) => prev + 16);
      return;
    }
    if (!hasMoreStaff) return;
    setLoadingMoreStaff(true);
    try {
      const nextPage = staffPage + 1;
      const res = await getAnimeStaff(parseInt(id, 10), nextPage, 25);
      if (res.staff && res.staff.length > 0) {
        setStaff((prev) => [...prev, ...res.staff]);
        setStaffPage(nextPage);
        setVisibleStaffCount((prev) => prev + res.staff.length);
        setHasMoreStaff(res.pageInfo?.hasNextPage ?? false);
      } else {
        setHasMoreStaff(false);
      }
    } catch {
      setHasMoreStaff(false);
    } finally {
      setLoadingMoreStaff(false);
    }
  };

  // Merged Anime & Character Artwork Gallery (Strictly anime art only - no voice actors/staff photos)
  const mergedGalleryImages = useMemo(() => {
    const list: any[] = [];
    if (anime.images?.jpg?.large_image_url) {
      list.push({
        url: anime.images.jpg.large_image_url,
        caption: `${displayTitle} - Main Poster`,
        type: "Poster",
      });
    }
    if (anime.banner_image) {
      list.push({
        url: anime.banner_image,
        caption: `${displayTitle} - Official Banner`,
        type: "Banner",
      });
    }
    characters.forEach((char) => {
      if (char.character?.images?.jpg?.image_url) {
        list.push({
          url: char.character.images.jpg.image_url,
          caption: `${char.character.name} (${char.role || "Character"})`,
          type: "Character",
        });
      }
    });
    relations.forEach((rel) => {
      rel.entry?.forEach((entry: any) => {
        if (entry.image) {
          list.push({
            url: entry.image,
            caption: `${entry.name} (${rel.relation})`,
            type: "Relation",
          });
        }
      });
    });
    return list;
  }, [anime, characters, relations, displayTitle]);

  const [galleryTitle, setGalleryTitle] = useState("Anime & Character Artwork");
  const activeGalleryList = mergedGalleryImages;

  const openLightboxAt = (imageUrl: string) => {
    if (!imageUrl) return;
    setGalleryTitle("Anime & Character Artwork");
    const index = mergedGalleryImages.findIndex((img) => img.url === imageUrl);
    setLightboxIndex(index !== -1 ? index : 0);
    setLightboxOpen(true);
  };

  const openCharGallery = (imageUrl?: string) => {
    if (!imageUrl) return;
    openLightboxAt(imageUrl);
  };

  const nextLightboxImage = () => {
    if (activeGalleryList.length === 0) return;
    setLightboxIndex((prev) => (prev + 1) % activeGalleryList.length);
  };

  const prevLightboxImage = () => {
    if (activeGalleryList.length === 0) return;
    setLightboxIndex((prev) => (prev - 1 + activeGalleryList.length) % activeGalleryList.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") nextLightboxImage();
      if (e.key === "ArrowLeft") prevLightboxImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, activeGalleryList.length]);

  // Firestore comments listener (safe in-memory sort prevents assertion crashes & missing index errors)
  useEffect(() => {
    if (!id) return;
    try {
      const commentsRef = collection(db, "comments");
      const q = query(commentsRef, where("animeId", "==", id.toString()));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a: any, b: any) => {
              const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
              const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
              return tB - tA;
            });
          setComments(fetched);
          setCommentsLoading(false);
        },
        () => {
          setComments([]);
          setCommentsLoading(false);
        }
      );
      return () => {
        try {
          unsubscribe();
        } catch {
          // Ignore
        }
      };
    } catch {
      setCommentsLoading(false);
    }
  }, [id]);

  // Firestore reviews listener (safe in-memory sort prevents assertion crashes & missing index errors)
  useEffect(() => {
    if (!id) return;
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("animeId", "==", id.toString()));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a: any, b: any) => {
              const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
              const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
              return tB - tA;
            });
          setReviews(fetched);
          setReviewsLoading(false);
        },
        () => {
          setReviews([]);
          setReviewsLoading(false);
        }
      );
      return () => {
        try {
          unsubscribe();
        } catch {
          // Ignore
        }
      };
    } catch {
      setReviewsLoading(false);
    }
  }, [id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    if (!checkRateLimit(`comment_${currentUser.uid}`, 3000)) {
      toast.warning("Please wait a few seconds before posting another comment!");
      return;
    }

    const cleanText = sanitizeInput(newComment, 2000);
    if (!cleanText) return;

    try {
      await addDoc(collection(db, "comments"), {
        animeId: id?.toString(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split("@")[0] || "Anonymous",
        userAvatar: currentUser.photoURL || "",
        text: cleanText,
        isSpoiler: isCommentSpoiler,
        animeTitle: displayTitle,
        animeImage: images?.jpg?.large_image_url || images?.jpg?.image_url || "",
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      setIsCommentSpoiler(false);
      toast.success("Comment posted successfully!");
    } catch {
      toast.error("Failed to post comment. Try again!");
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    if (!checkRateLimit(`review_${currentUser.uid}`, 5000)) {
      toast.warning("Please wait a few seconds before posting another review!");
      return;
    }

    const cleanReview = sanitizeInput(newReviewText, 3000);
    if (!cleanReview) return;

    try {
      await addDoc(collection(db, "reviews"), {
        animeId: id?.toString(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split("@")[0] || "Anonymous",
        userAvatar: currentUser.photoURL || "",
        rating: Number(newReviewRating),
        text: cleanReview,
        animeTitle: displayTitle,
        animeImage: images?.jpg?.large_image_url || images?.jpg?.image_url || "",
        createdAt: serverTimestamp(),
      });
      setNewReviewText("");
      setNewReviewRating(10);
      toast.success("Review posted successfully!");
    } catch {
      toast.error("Failed to post review. Try again!");
    }
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleFavouriteToggle = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (isFav) {
      removeFromFavourites(mal_id);
    } else {
      addToFavourites(anime);
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: displayTitle,
        text: `Check out ${displayTitle} on Anime Orbit!`,
        url: window.location.href,
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      // Ignored
    }
  };

  const cleanSynopsis = useMemo(() => {
    if (!synopsis) return "Explore full episode guides, characters, reviews, and stats on Anime Orbit.";
    return synopsis.replace(/<[^>]+>/g, "").slice(0, 240) + "...";
  }, [synopsis]);

  const animeStructuredData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": type === "Movie" ? "Movie" : "TVSeries",
      name: displayTitle,
      alternateName: title_japanese || undefined,
      description: cleanSynopsis,
      image: images?.jpg?.large_image_url || "",
      aggregateRating: score
        ? {
            "@type": "AggregateRating",
            ratingValue: score,
            bestRating: "10",
            worstRating: "1",
            ratingCount: anime?.scored_by || 1000,
          }
        : undefined,
      genre: genres?.map((g: any) => g?.name || g),
      numberOfEpisodes: totalEpisodes || undefined,
      url: `https://animeorbit.web.app/anime/${id}`,
    };
  }, [displayTitle, title_japanese, cleanSynopsis, images, score, anime?.scored_by, genres, totalEpisodes, id, type]);

  if (loading && !anime) {
    return (
      <Container>
        <Skeleton height={420} baseColor="#1e1e1e" highlightColor="#2d2d2d" borderRadius={16} />
        <div style={{ marginTop: "2rem" }}>
          <Skeleton count={4} height={20} baseColor="#1e1e1e" highlightColor="#2d2d2d" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <SEO
        title={`${displayTitle} - Episodes, Characters & Reviews`}
        description={`${displayTitle}: ${cleanSynopsis}`}
        keywords={`${displayTitle}, ${genres?.map((g: any) => g.name || g).join(", ")}, anime episodes, anime characters, anime reviews, Anime Orbit`}
        image={images?.jpg?.large_image_url || PosterImage}
        url={`https://animeorbit.web.app/anime/${id}`}
        type={type === "Movie" ? "video.movie" : "video.tv_show"}
        structuredData={animeStructuredData}
      />
      <BackgroundImage
        style={{
          backgroundImage: `url(${anime.banner_image || images?.jpg?.large_image_url || ""})`,
        }}
        onClick={() => openLightboxAt(anime.banner_image || images?.jpg?.large_image_url)}
        title="Click to view artwork in Gallery"
      >
        <Overlay />
      </BackgroundImage>

      <TopBarWrapper>
        <BackButton onClick={handleBack} aria-label="Go Back">
          <ArrowLeft size={18} />
          <span>Back</span>
        </BackButton>
      </TopBarWrapper>

      <HeroSection>
        <PosterWrapper>
          <PosterImage
            src={images?.jpg?.large_image_url}
            alt={displayTitle}
            onClick={() => openLightboxAt(images?.jpg?.large_image_url)}
          />
          {mergedGalleryImages.length > 0 && (
            <GalleryTriggerBtn onClick={() => openLightboxAt(images?.jpg?.large_image_url)}>
              <ImageIcon size={16} />
              <span>Open Gallery ({mergedGalleryImages.length})</span>
            </GalleryTriggerBtn>
          )}
        </PosterWrapper>

        <HeroDetails>
          <Title>{displayTitle}</Title>
          {title_japanese && <JapaneseTitle>{title_japanese}</JapaneseTitle>}

          <BadgesRow>
            {score && (
              <ScoreBadge>
                <Star size={15} fill="#ffd700" color="#ffd700" />
                <span>{score}</span>
              </ScoreBadge>
            )}
            {rank && (
              <Badge>
                <Award size={15} color="#ffd700" />
                <span>Rank #{rank}</span>
              </Badge>
            )}
            {type && (
              <Badge>
                <Tv size={15} color="#ffd700" />
                <span>{type}</span>
              </Badge>
            )}
            {status === "Not yet aired" || status === "Upcoming" ? (
              <Badge>
                <Film size={15} color="#ffd700" />
                <span>Upcoming Release</span>
              </Badge>
            ) : totalEpisodes !== undefined && totalEpisodes !== null ? (
              <Badge>
                <Film size={15} color="#ffd700" />
                <span>
                  {totalEpisodes === 0 && status === "Airing"
                    ? "Ongoing"
                    : `${totalEpisodes}${anime.isOngoing ? "+ (Ongoing)" : " Episodes"}`}
                </span>
              </Badge>
            ) : null}
            {year && (
              <Badge>
                <Calendar size={15} color="#ffd700" />
                <span>{year}</span>
              </Badge>
            )}
          </BadgesRow>

          <ActionsRow>
            <ActionButton
              $variant={isFav ? "active" : "default"}
              onClick={handleFavouriteToggle}
            >
              <Heart size={18} fill={isFav ? "#ff4d4d" : "none"} color={isFav ? "#ff4d4d" : "#fff"} />
              <span>{isFav ? "Favorited" : "Add Favorite"}</span>
            </ActionButton>

            <div style={{ position: "relative" }} ref={statusDropdownRef}>
              <ActionButton
                $variant={currentStatus ? "success" : "default"}
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              >
                <Bookmark size={18} fill={currentStatus ? "#27ae60" : "none"} color={currentStatus ? "#27ae60" : "#fff"} />
                <span>{currentStatus ? currentStatus : "Add to List"}</span>
                <ChevronDown size={14} />
              </ActionButton>

              {statusDropdownOpen && (
                <StatusDropdown>
                  {["Watching", "Completed", "Plan to Watch", "On-Hold", "Dropped"].map((opt) => (
                    <StatusOption
                      key={opt}
                      $active={currentStatus === opt}
                      onClick={() => {
                        updateAnimeStatus(anime, opt);
                        setStatusDropdownOpen(false);
                      }}
                    >
                      {opt}
                    </StatusOption>
                  ))}
                  {currentStatus && (
                    <StatusOption
                      className="remove"
                      onClick={() => {
                        updateAnimeStatus(anime, null);
                        setStatusDropdownOpen(false);
                      }}
                    >
                      Remove from Tracker
                    </StatusOption>
                  )}
                </StatusDropdown>
              )}
            </div>

            <ActionButton onClick={handleShare}>
              <Share2 size={18} />
              <span>Share</span>
            </ActionButton>
          </ActionsRow>
        </HeroDetails>
      </HeroSection>

      <TabsBar>
        {[
          { id: "overview", label: "Overview" },
          { id: "episodes", label: `Episodes ${totalEpisodes ? `(${totalEpisodes})` : ""}` },
          { id: "characters", label: "Characters" },
          { id: "staff", label: "Staff" },
          { id: "related", label: `Related ${relations.length ? `(${relations.length})` : ""}` },
          { id: "discussion", label: "Discussion" },
          { id: "reviews", label: "Reviews" },
        ].map((tab) => (
          <TabButton
            key={tab.id}
            $active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabsBar>

      <TabContent>
        {activeTab === "overview" && (
          <OverviewContent>
            <SectionTitle>Synopsis</SectionTitle>
            <SynopsisText>
              {synopsis ? (
                <>
                  {showMore ? synopsis : `${synopsis.substring(0, 450)}...`}
                  {synopsis.length > 450 && (
                    <ReadMoreBtn onClick={() => setShowMore(!showMore)}>
                      {showMore ? "Show Less" : "Read More"}
                    </ReadMoreBtn>
                  )}
                </>
              ) : (
                "Synopsis not available"
              )}
            </SynopsisText>

            {genres && genres.length > 0 && (
              <GenresWrapper>
                {genres.map((g: any) => (
                  <GenreBadge key={g.mal_id}>{g.name}</GenreBadge>
                ))}
              </GenresWrapper>
            )}

            <InfoGrid>
              <InfoCard>
                <InfoLabel>Studios</InfoLabel>
                <InfoValue>
                  {studios && studios.length > 0 ? studios.map((s: any) => s.name).join(", ") : "Toei Animation"}
                </InfoValue>
              </InfoCard>
              <InfoCard>
                <InfoLabel>Producers</InfoLabel>
                <InfoValue>
                  {producers && producers.length > 0
                    ? producers.slice(0, 3).map((p: any) => p.name).join(", ")
                    : (studios && studios.length > 0 ? studios.map((s: any) => s.name).join(", ") : "Shueisha, Fuji TV")}
                </InfoValue>
              </InfoCard>
              <InfoCard>
                <InfoLabel>Source</InfoLabel>
                <InfoValue>{source || "Manga"}</InfoValue>
              </InfoCard>
              <InfoCard>
                <InfoLabel>Duration</InfoLabel>
                <InfoValue>{duration || "24 min"}</InfoValue>
              </InfoCard>
              <InfoCard>
                <InfoLabel>Status</InfoLabel>
                <InfoValue>{status || "Finished Airing"}</InfoValue>
              </InfoCard>
              <InfoCard>
                <InfoLabel>Aired</InfoLabel>
                <InfoValue>{anime.aired?.string || "N/A"}</InfoValue>
              </InfoCard>
            </InfoGrid>

            {(() => {
              const ytId = trailer?.youtube_id || trailer?.id || (trailer?.embed_url ? trailer.embed_url.match(/(?:embed\/|v=|\/vi\/|youtu\.be\/|\/v\/)([^?&#]+)/)?.[1] : null);
              const cleanEmbedUrl = ytId
                ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
                : `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(displayTitle + " official anime trailer pv")}&autoplay=1`;
              const directWatchUrl = ytId
                ? `https://www.youtube.com/watch?v=${ytId}`
                : `https://www.youtube.com/results?search_query=${encodeURIComponent(displayTitle + " official anime trailer pv")}`;

              return (
                <TrailerSection>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <SectionTitle style={{ margin: 0 }}>Official Trailer & Preview</SectionTitle>
                    <a
                      href={directWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "rgba(255, 0, 0, 0.15)",
                        border: "1px solid rgba(255, 77, 77, 0.4)",
                        color: "#ff6b6b",
                        padding: "0.35rem 0.9rem",
                        borderRadius: "20px",
                        fontFamily: "Montserrat, sans-serif",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        textDecoration: "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Watch on YouTube</span>
                    </a>
                  </div>

                  {trailerLoaded ? (
                    <div style={{ position: "relative", width: "100%" }}>
                      <TrailerIframe
                        src={cleanEmbedUrl}
                        title={`${displayTitle} Official Trailer`}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setTrailerLoaded(true)}
                      className="relative w-full aspect-video rounded-2xl overflow-hidden border border-[#ffd700]/40 cursor-pointer group bg-black shadow-2xl flex items-center justify-center"
                      style={{
                        backgroundImage: `url(${anime.banner_image || images?.jpg?.large_image_url || ""})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-[#ffd700] text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,215,0,0.7)] group-hover:scale-110 transition-transform">
                          <Play size={28} fill="#000" className="ml-1" />
                        </div>
                        <span className="font-montserrat font-bold text-sm text-white drop-shadow">
                          Click to Play Official Trailer
                        </span>
                      </div>
                    </div>
                  )}
                </TrailerSection>
              );
            })()}

            {/* Official Legal Streaming Portals Deep Links */}
            <div style={{ marginTop: "2.5rem", padding: "1.5rem", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", backdropFilter: "blur(10px)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h4 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, color: "#ffd700", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                  <ExternalLink size={18} />
                  <span>Official Legal Streaming Portals</span>
                </h4>
                <span style={{ fontSize: "0.75rem", color: "#888" }}>Search and watch on verified platforms</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <a
                  href={`https://www.crunchyroll.com/search?q=${encodeURIComponent(displayTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem 1.1rem", background: "rgba(244, 117, 33, 0.15)", border: "1px solid rgba(244, 117, 33, 0.4)", borderRadius: "14px", color: "#f47521", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", transition: "all 0.2s ease" }}
                >
                  <Film size={14} />
                  <span>Crunchyroll</span>
                </a>
                <a
                  href={`https://www.netflix.com/search?q=${encodeURIComponent(displayTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem 1.1rem", background: "rgba(229, 9, 20, 0.15)", border: "1px solid rgba(229, 9, 20, 0.4)", borderRadius: "14px", color: "#ff4d4d", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", transition: "all 0.2s ease" }}
                >
                  <Tv size={14} />
                  <span>Netflix</span>
                </a>
                <a
                  href={`https://www.disneyplus.com/search?q=${encodeURIComponent(displayTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem 1.1rem", background: "rgba(17, 60, 207, 0.15)", border: "1px solid rgba(17, 60, 207, 0.4)", borderRadius: "14px", color: "#54a0ff", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", transition: "all 0.2s ease" }}
                >
                  <Play size={14} />
                  <span>Disney+</span>
                </a>
                <a
                  href={`https://www.hulu.com/search?q=${encodeURIComponent(displayTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem 1.1rem", background: "rgba(28, 231, 131, 0.15)", border: "1px solid rgba(28, 231, 131, 0.4)", borderRadius: "14px", color: "#1ce783", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", transition: "all 0.2s ease" }}
                >
                  <Film size={14} />
                  <span>Hulu</span>
                </a>
              </div>
            </div>
          </OverviewContent>
        )}

        {activeTab === "episodes" && (
          <EpisodesView
            episodes={episodes}
            totalEpisodes={totalEpisodes}
            animeTitle={displayTitle}
            onImageClick={openLightboxAt}
          />
        )}

        {activeTab === "characters" && (
          <div>
            {/* Character Search & Filter Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#ffd700", fontFamily: "Montserrat, sans-serif" }}>
                Characters ({characters.length})
              </h3>
              <div style={{ position: "relative", minWidth: "240px", maxWidth: "340px", width: "100%" }}>
                <Search size={16} color="#888" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="character-search-input"
                  name="characterSearch"
                  type="text"
                  placeholder="Search character or voice actor..."
                  value={charSearch}
                  onChange={(e) => setCharSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 1rem 0.55rem 2.2rem",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "20px",
                    color: "#fff",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <CharacterGrid>
              {characters
                .filter((char) => {
                  if (!charSearch.trim()) return true;
                  const q = charSearch.toLowerCase();
                  return (
                    char.character?.name?.toLowerCase().includes(q) ||
                    char.role?.toLowerCase().includes(q) ||
                    char.voice_actors?.[0]?.person?.name?.toLowerCase().includes(q)
                  );
                })
                .slice(0, charSearch.trim() ? undefined : visibleCharCount)
                .map((char, idx) => (
                  <CharacterCard key={idx}>
                    <CharacterImage
                      src={char.character?.images?.jpg?.image_url}
                      alt={char.character?.name}
                      onClick={() => openCharGallery(char.character?.images?.jpg?.image_url)}
                      title="Click for character artwork view"
                      style={{ cursor: "pointer" }}
                    />
                    <CharacterInfo>
                      <CharacterName
                        onClick={() => openCharGallery(char.character?.images?.jpg?.image_url)}
                        style={{ cursor: "pointer" }}
                      >
                        {char.character?.name}
                      </CharacterName>
                      <CharacterRole>{char.role}</CharacterRole>
                      {char.voice_actors?.[0] && (
                        <VoiceActorInfo>
                          VA: {char.voice_actors[0].person?.name}
                        </VoiceActorInfo>
                      )}
                    </CharacterInfo>
                  </CharacterCard>
                ))}
            </CharacterGrid>

            {!charSearch.trim() && (visibleCharCount < characters.length || hasMoreChars) && (
              <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <button
                  onClick={loadMoreCharacters}
                  disabled={loadingMoreChars}
                  style={{
                    background: "#ffd700",
                    color: "#141414",
                    fontWeight: 800,
                    padding: "0.7rem 2rem",
                    borderRadius: "25px",
                    border: "none",
                    cursor: loadingMoreChars ? "not-allowed" : "pointer",
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "0.85rem",
                    opacity: loadingMoreChars ? 0.7 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  {loadingMoreChars ? "Loading more characters..." : `Load More (${characters.length} shown)`}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "staff" && (
          <div>
            {/* Staff Search & Filter Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#ffd700", fontFamily: "Montserrat, sans-serif" }}>
                Staff & Production Crew ({staff.length})
              </h3>
              <div style={{ position: "relative", minWidth: "240px", maxWidth: "340px", width: "100%" }}>
                <Search size={16} color="#888" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="staff-search-input"
                  name="staffSearch"
                  type="text"
                  placeholder="Search staff or director..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 1rem 0.55rem 2.2rem",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "20px",
                    color: "#fff",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <StaffGrid>
              {staff
                .filter((st) => {
                  if (!staffSearch.trim()) return true;
                  const q = staffSearch.toLowerCase();
                  return (
                    st.person?.name?.toLowerCase().includes(q) ||
                    st.positions?.some((p: string) => p.toLowerCase().includes(q))
                  );
                })
                .slice(0, staffSearch.trim() ? undefined : visibleStaffCount)
                .map((st, idx) => (
                  <StaffCard key={idx}>
                    <StaffImage
                      src={st.person?.images?.jpg?.image_url}
                      alt={st.person?.name}
                      loading="lazy"
                    />
                    <StaffInfo>
                      <StaffName>
                        {st.person?.name}
                      </StaffName>
                      <StaffPositions>{st.positions?.join(", ")}</StaffPositions>
                    </StaffInfo>
                  </StaffCard>
                ))}
            </StaffGrid>

            {!staffSearch.trim() && (visibleStaffCount < staff.length || hasMoreStaff) && (
              <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <button
                  onClick={loadMoreStaff}
                  disabled={loadingMoreStaff}
                  style={{
                    background: "#ffd700",
                    color: "#141414",
                    fontWeight: 800,
                    padding: "0.7rem 2rem",
                    borderRadius: "25px",
                    border: "none",
                    cursor: loadingMoreStaff ? "not-allowed" : "pointer",
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "0.85rem",
                    opacity: loadingMoreStaff ? 0.7 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  {loadingMoreStaff ? "Loading more staff..." : `Load More(${staff.length} shown)`}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "related" && (
          <div>
            {relations.length > 0 ? (
              relations.map((relation, idx) => (
                <RelationGroup key={idx}>
                  <RelationTypeHeader>
                    <BookOpen size={20} color="#ffd700" style={{ marginRight: "0.5rem" }} />
                    <span>{relation.relation}</span>
                    <span className="count">({relation.entry.length})</span>
                  </RelationTypeHeader>

                  <RelationList>
                    {relation.entry.map((entry: any) => {
                      const isManga =
                        entry.type?.toLowerCase() === "manga" ||
                        entry.type?.toLowerCase() === "novel" ||
                        entry.type?.toLowerCase() === "light_novel" ||
                        relation.relation?.toLowerCase().includes("adaptation");
                      const targetUrl = isManga ? `/manga/${entry.mal_id}` : `/anime/${entry.mal_id}`;

                      return (
                        <RelationCard key={entry.mal_id} to={targetUrl}>
                          <RelationCoverWrapper>
                            {entry.image ? (
                              <img src={entry.image} alt={entry.name} loading="lazy" />
                            ) : (
                              <div className="no-image">No Image</div>
                            )}
                            <RelationBadge>{relation.relation}</RelationBadge>
                            {entry.score && (
                              <RelationScoreBadge>
                                <Star size={10} fill="#ffd700" color="#ffd700" style={{ display: 'inline', marginRight: '2px' }} />
                                {entry.score}
                              </RelationScoreBadge>
                            )}
                          </RelationCoverWrapper>
                          <RelationDetails>
                            <RelationName>{entry.name}</RelationName>
                            <RelationMeta>{entry.type || (isManga ? "Manga" : "Anime")}</RelationMeta>
                          </RelationDetails>
                        </RelationCard>
                      );
                    })}
                  </RelationList>
                </RelationGroup>
              ))
            ) : (
              <EmptyState>No related series found.</EmptyState>
            )}
          </div>
        )}

        {activeTab === "discussion" && (
          <DiscussionContent>
            <SectionTitle>Discussion & Community</SectionTitle>

            {currentUser ? (
              <CommentForm onSubmit={handlePostComment}>
                <CommentInput
                  id="anime-comment-input"
                  name="animeComment"
                  placeholder="Share your thoughts about this episode or series..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8rem", color: "#aaa", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isCommentSpoiler}
                      onChange={(e) => setIsCommentSpoiler(e.target.checked)}
                      style={{ accentColor: "#ffd700", width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <span style={{ color: isCommentSpoiler ? "#ffd700" : "#aaa", fontWeight: isCommentSpoiler ? 700 : 500 }}>
                      ⚠️ Contains Spoilers (Blur for others)
                    </span>
                  </label>
                  <CommentSubmitButton type="submit">Post Comment</CommentSubmitButton>
                </div>
              </CommentForm>
            ) : (
              <SignInPrompt onClick={() => setAuthModalOpen(true)}>
                Sign in to join the conversation and post a comment!
              </SignInPrompt>
            )}

            <CommentsList>
              {commentsLoading ? (
                <LoadingText>Loading comments...</LoadingText>
              ) : comments.length > 0 ? (
                comments.map((comment) => {
                  const isSpoiler = comment.isSpoiler;
                  const isRevealed = revealedSpoilers[comment.id];

                  return (
                    <CommentCard key={comment.id}>
                      <UserAvatarSmall>
                        {comment.userAvatar ? (
                          <img src={comment.userAvatar} alt="Avatar" />
                        ) : (
                          <UserCheck size={18} color="#ffd700" />
                        )}
                      </UserAvatarSmall>
                      <CommentBody>
                        <CommentHeader>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span className="author">{comment.userName}</span>
                            {isSpoiler && (
                              <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "6px", background: "rgba(255, 77, 77, 0.2)", color: "#ff6b6b", border: "1px solid rgba(255, 77, 77, 0.4)", fontWeight: 700 }}>
                                SPOILER
                              </span>
                            )}
                          </div>
                          <span className="date">
                            {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : "Recently"}
                          </span>
                        </CommentHeader>

                        {isSpoiler && !isRevealed ? (
                          <div
                            onClick={() => setRevealedSpoilers((prev) => ({ ...prev, [comment.id]: true }))}
                            style={{
                              marginTop: "0.5rem",
                              padding: "0.75rem 1rem",
                              background: "rgba(255, 77, 77, 0.08)",
                              border: "1px dashed rgba(255, 77, 77, 0.4)",
                              borderRadius: "12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "0.5rem"
                            }}
                          >
                            <span style={{ fontSize: "0.8rem", color: "#ff8888", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <AlertTriangle size={15} />
                              <span>This comment contains spoilers. Click to reveal.</span>
                            </span>
                            <Eye size={16} color="#ff8888" />
                          </div>
                        ) : (
                          <div style={{ position: "relative" }}>
                            <CommentText>{comment.text}</CommentText>
                            {isSpoiler && (
                              <button
                                onClick={() => setRevealedSpoilers((prev) => ({ ...prev, [comment.id]: false }))}
                                style={{ background: "none", border: "none", color: "#777", fontSize: "0.7rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.3rem" }}
                              >
                                <EyeOff size={12} /> Hide Spoiler
                              </button>
                            )}
                          </div>
                        )}
                      </CommentBody>
                    </CommentCard>
                  );
                })
              ) : (
                <EmptyState>No comments yet. Start the discussion!</EmptyState>
              )}
            </CommentsList>
          </DiscussionContent>
        )}

        {activeTab === "reviews" && (
          <ReviewsContent>
            <SectionTitle>User Reviews & Ratings</SectionTitle>

            {currentUser ? (
              <ReviewForm onSubmit={handlePostReview}>
                <ReviewFormHeader>
                  <span className="rating-label">Your Rating:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        fill={
                          (hoverRating !== null ? star <= hoverRating : star <= newReviewRating)
                            ? "#ffd700"
                            : "none"
                        }
                        color="#ffd700"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setNewReviewRating(star)}
                        style={{
                          cursor: "pointer",
                          transition: "transform 0.15s ease",
                          transform: hoverRating === star ? "scale(1.25)" : "scale(1)",
                        }}
                      />
                    ))}
                    <span style={{ color: "#ffd700", fontWeight: 800, fontSize: "0.95rem", marginLeft: "0.5rem" }}>
                      {hoverRating !== null ? hoverRating : newReviewRating} / 10 Stars
                    </span>
                  </div>
                </ReviewFormHeader>
                <ReviewTextArea
                  id="anime-review-textarea"
                  name="animeReview"
                  placeholder="Write your comprehensive anime review..."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                />
                <ReviewSubmitButton type="submit">Submit Review</ReviewSubmitButton>
              </ReviewForm>
            ) : (
              <SignInPrompt onClick={() => setAuthModalOpen(true)}>
                Sign in to write and publish your anime review!
              </SignInPrompt>
            )}

            <ReviewsList>
              {reviewsLoading ? (
                <LoadingText>Loading reviews...</LoadingText>
              ) : reviews.length > 0 ? (
                reviews.map((rev) => (
                  <ReviewItemCard key={rev.id}>
                    <ReviewItemHeader>
                      <ReviewAuthorMeta>
                        <span className="name">{rev.userName}</span>
                        <span className="date">
                          {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString() : "Recently"}
                        </span>
                      </ReviewAuthorMeta>
                      <ReviewScoreBadge>
                        <Star size={12} fill="#ffd700" color="#ffd700" style={{ display: 'inline', marginRight: '4px' }} />
                        <span>{rev.rating} / 10</span>
                      </ReviewScoreBadge>
                    </ReviewItemHeader>
                    <ReviewBodyText>{rev.text}</ReviewBodyText>
                  </ReviewItemCard>
                ))
              ) : (
                <EmptyState>No reviews yet. Be the first to review!</EmptyState>
              )}
            </ReviewsList>
          </ReviewsContent>
        )}
      </TabContent>

      <AnimatePresence>
        {lightboxOpen && activeGalleryList.length > 0 && (
          <LightboxOverlay onClick={() => setLightboxOpen(false)}>
            <LightboxContainer onClick={(e) => e.stopPropagation()}>
              <LightboxHeader>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>

                  <LightboxCounter>
                    <ImageIcon size={16} color="#ffd700" style={{ marginRight: "0.4rem" }} />
                    <span>
                      {lightboxIndex + 1} / {activeGalleryList.length}
                    </span>
                    <LightboxTypeBadge>{activeGalleryList[lightboxIndex]?.type || galleryTitle}</LightboxTypeBadge>
                  </LightboxCounter>
                </div>

                <LightboxCloseBtn onClick={() => setLightboxOpen(false)}>
                  <button
                    onClick={() => setLightboxOpen(false)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: "rgba(255, 215, 0, 0.15)",
                      border: "1px solid rgba(255, 215, 0, 0.4)",
                      color: "#ffd700",
                      padding: "0.35rem 0.9rem",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "Montserrat, sans-serif",
                    }}
                  >
                  <X size={24} color="#fff" />
                  </button>
                </LightboxCloseBtn>
              </LightboxHeader>

              <LightboxImageStage>
                {activeGalleryList.length > 1 && (
                  <LightboxNavBtn className="prev" onClick={prevLightboxImage} aria-label="Previous image">
                    <ChevronLeft size={28} />
                  </LightboxNavBtn>
                )}
                <LightboxMainImage
                  src={activeGalleryList[lightboxIndex]?.url}
                  alt={activeGalleryList[lightboxIndex]?.caption}
                />
                {activeGalleryList.length > 1 && (
                  <LightboxNavBtn className="next" onClick={nextLightboxImage} aria-label="Next image">
                    <ChevronRight size={28} />
                  </LightboxNavBtn>
                )}
              </LightboxImageStage>

              <LightboxCaption>{activeGalleryList[lightboxIndex]?.caption}</LightboxCaption>

              {/* Bottom Thumbnail Strip */}
              {activeGalleryList.length > 1 && (
                <LightboxThumbnails>
                  {activeGalleryList.map((img, idx) => (
                    <LightboxThumbItem
                      key={idx}
                      $active={idx === lightboxIndex}
                      onClick={() => setLightboxIndex(idx)}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img src={img.url} alt={img.caption || `Thumb ${idx + 1}`} />
                    </LightboxThumbItem>
                  ))}
                </LightboxThumbnails>
              )}
            </LightboxContainer>
          </LightboxOverlay>
        )}
      </AnimatePresence>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Container>
  );
};

// Episodes Batch Component
const EpisodesView: React.FC<{
  episodes: any[];
  totalEpisodes?: number;
  animeTitle?: string;
  onImageClick: (url: string) => void;
}> = ({
  episodes,
  totalEpisodes,
  animeTitle,
  onImageClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(0);
  const [renderLimit, setRenderLimit] = useState(24);
  const observerRef = useRef<HTMLDivElement>(null);

  const batchSize = 50;
  const count = episodes.length;

  const batches = useMemo(() => {
    if (count <= batchSize) return [];
    const numBatches = Math.ceil(count / batchSize);
    const list: any[] = [];
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize + 1;
      const end = Math.min((i + 1) * batchSize, count);
      list.push({ index: i, label: `${start} - ${end}` });
    }
    return list;
  }, [count]);

  // Reset render limit whenever batch or search query changes
  useEffect(() => {
    setRenderLimit(24);
  }, [selectedBatch, searchQuery]);

  const allFilteredEpisodes = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return episodes.filter(
        (ep) =>
          ep.mal_id.toString() === q ||
          (ep.title && ep.title.toLowerCase().includes(q))
      );
    }
    if (batches.length === 0) return episodes;
    const startIdx = selectedBatch * batchSize;
    return episodes.slice(startIdx, startIdx + batchSize);
  }, [episodes, searchQuery, selectedBatch, batches.length]);

  const displayedEpisodes = useMemo(() => {
    return allFilteredEpisodes.slice(0, renderLimit);
  }, [allFilteredEpisodes, renderLimit]);

  // Progressive Infinite Scroll Observer
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && renderLimit < allFilteredEpisodes.length) {
          setRenderLimit((prev) => Math.min(prev + 24, allFilteredEpisodes.length));
        }
      },
      { rootMargin: "250px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [renderLimit, allFilteredEpisodes.length]);

  return (
    <EpisodesContent>
      <EpisodesHeaderRow>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <SectionTitle style={{ margin: 0 }}>
            Episodes ({totalEpisodes || episodes.length})
          </SectionTitle>

          {batches.length > 1 && !searchQuery.trim() && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#ffd700", fontWeight: 700 }}>Jump to:</span>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(Number(e.target.value))}
                style={{
                  background: "#1e1e1e",
                  color: "#ffd700",
                  border: "1px solid rgba(255, 215, 0, 0.4)",
                  borderRadius: "20px",
                  padding: "0.35rem 0.8rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: "Montserrat, sans-serif"
                }}
              >
                {batches.map((b) => (
                  <option key={b.index} value={b.index}>
                    Episodes {b.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <EpisodeSearchWrapper>
          <Search size={16} color="#888" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <EpisodeSearchInput
            type="text"
            placeholder="Search episode # or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </EpisodeSearchWrapper>
      </EpisodesHeaderRow>

      {batches.length > 0 && !searchQuery.trim() && (
        <BatchContainer
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY * 1.5;
            }
          }}
        >
          {batches.map((b) => (
            <BatchButton
              key={b.index}
              $active={selectedBatch === b.index}
              onClick={() => setSelectedBatch(b.index)}
            >
              {b.label}
            </BatchButton>
          ))}
        </BatchContainer>
      )}

      {displayedEpisodes.length > 0 ? (
        <>
          <EpisodeGrid>
            {displayedEpisodes.map((episode) => (
              <EpisodeCard key={episode.mal_id}>
                <EpisodeMediaWrapper onClick={() => episode.thumbnail && onImageClick(episode.thumbnail)}>
                  {episode.thumbnail ? (
                    <img src={episode.thumbnail} alt={episode.title} loading="lazy" />
                  ) : (
                    <EpisodePlaceholder>
                      <Film size={28} color="#ffd700" />
                    </EpisodePlaceholder>
                  )}
                  <EpisodeBadge>EP {episode.mal_id}</EpisodeBadge>
                  <EpisodePlayBtn
                    href={episode.url || `https://www.google.com/search?q=${encodeURIComponent((animeTitle || "Anime") + " Episode " + episode.mal_id + " stream online")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`Watch Episode ${episode.mal_id} online`}
                  >
                    <Play size={15} fill="#fff" color="#fff" />
                  </EpisodePlayBtn>
                </EpisodeMediaWrapper>
                <EpisodeInfo>
                  <EpisodeTitleRow>
                    <EpisodeTitle>{episode.title || `Episode ${episode.mal_id}`}</EpisodeTitle>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      <EpisodeSiteBadge>{episode.site || "Stream"}</EpisodeSiteBadge>
                      <a
                        href={`https://www.imdb.com/find/?q=${encodeURIComponent((animeTitle || "Anime") + " Episode " + episode.mal_id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          background: "#f5c518",
                          color: "#000",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          textDecoration: "none",
                          lineHeight: "1.2",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
                        }}
                        title="Search episode on IMDb"
                      >
                        IMDb
                      </a>
                    </div>
                  </EpisodeTitleRow>
                  <EpisodeSummaryText>
                    {episode.summary || (episode.aired ? `Aired: ${new Date(episode.aired).toLocaleDateString()} • Episode ${episode.mal_id}` : `Episode ${episode.mal_id} of the series.`)}
                  </EpisodeSummaryText>
                </EpisodeInfo>
              </EpisodeCard>
            ))}
          </EpisodeGrid>

          {/* Infinite Scroll Trigger Anchor */}
          <div ref={observerRef} style={{ height: "40px", margin: "1rem 0", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {renderLimit < allFilteredEpisodes.length && (
              <button
                onClick={() => setRenderLimit((prev) => Math.min(prev + 24, allFilteredEpisodes.length))}
                style={{
                  background: "rgba(255, 215, 0, 0.15)",
                  border: "1px solid rgba(255, 215, 0, 0.4)",
                  color: "#ffd700",
                  padding: "0.5rem 1.5rem",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Showing {renderLimit} of {allFilteredEpisodes.length} Episodes — Load More
              </button>
            )}
          </div>
        </>
      ) : (
        <EmptyState>
          <Film size={36} color="#ffd700" style={{ margin: "0 auto 0.75rem", opacity: 0.8 }} />
          <p style={{ color: "white", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.25rem" }}>
            {searchQuery.trim() ? "No episodes match your search query." : "Upcoming Anime Release"}
          </p>
          <p style={{ color: "#888", fontSize: "0.85rem" }}>
            {searchQuery.trim()
              ? "Try searching for a different episode number or title."
              : "Official episode listings and streams will appear once the anime begins broadcasting."}
          </p>
        </EmptyState>
      )}
    </EpisodesContent>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: #141414;
  color: white;
  position: relative;
  padding-bottom: 4rem;
`;

const TopBarWrapper = styled.div`
  position: relative;
  z-index: 40;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 2rem 0.5rem;
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    padding: 1rem 1rem 0.5rem;
  }
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  padding: 0.5rem 1.1rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);

  &:hover {
    background: #ffd700;
    color: #141414;
    transform: translateX(-4px);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.85rem;
    font-size: 0.75rem;
  }
`;

const BackgroundImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 640px;
  background-size: cover;
  background-position: center top;
  z-index: 0;
  opacity: 0.45;
  filter: blur(1px);
  cursor: pointer;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0) 100%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0) 100%);
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 60%, #141414 100%);
`;

const HeroSection = styled.div`
  position: relative;
  z-index: 30;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.5rem 2rem 2rem;
  display: flex;
  gap: 3rem;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
    padding: 0.5rem 1rem 1.5rem;
  }
`;

const PosterWrapper = styled.div`
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  @media (max-width: 768px) {
    width: 180px;
  }
`;

const PosterImage = styled.img`
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 16px;
  border: 2px solid rgba(255, 215, 0, 0.4);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.03);
  }
`;

const GalleryTriggerBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  border-radius: 25px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #ffd700;
    color: #141414;
  }
`;

const HeroDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Title = styled.h1`
  font-family: "Staatliches", cursive;
  font-size: 3.5rem;
  letter-spacing: 0.02em;
  color: white;
  margin: 0;
  line-height: 1.1;
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const JapaneseTitle = styled.h2`
  font-family: "Noto Sans JP", sans-serif;
  font-size: 1.1rem;
  color: #a0a0a0;
  font-weight: 400;
  margin: 0;
`;

const BadgesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ScoreBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.5);
  color: #ffd700;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e0e0e0;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 0.5rem;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ActionButton = styled.button<{ $variant?: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.4rem;
  border-radius: 25px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: ${({ $variant }) =>
    $variant === "active"
      ? "rgba(255, 77, 77, 0.2)"
      : $variant === "success"
      ? "rgba(39, 174, 96, 0.2)"
      : "rgba(255, 255, 255, 0.08)"};
  color: ${({ $variant }) =>
    $variant === "active" ? "#ff4d4d" : $variant === "success" ? "#27ae60" : "white"};
  border-color: ${({ $variant }) =>
    $variant === "active" ? "#ff4d4d" : $variant === "success" ? "#27ae60" : "rgba(255, 255, 255, 0.2)"};

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    color: #ffd700;
  }
`;

const StatusDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: #141416;
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 12px;
  padding: 0.5rem;
  min-width: 190px;
  z-index: 1000;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(16px);
`;

const StatusOption = styled.button<{ $active?: boolean }>`
  width: 100%;
  text-align: left;
  padding: 0.55rem 0.9rem;
  background: ${({ $active }) => ($active ? "rgba(255, 215, 0, 0.2)" : "transparent")};
  color: ${({ $active }) => ($active ? "#ffd700" : "#d0d0d0")};
  border: none;
  border-radius: 8px;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.15);
    color: #ffd700;
  }

  &.remove {
    color: #ff4d4d;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: 0.4rem;
    padding-top: 0.6rem;

    &:hover {
      background: rgba(255, 77, 77, 0.15);
      color: #ff6b6b;
    }
  }
`;

const TabsBar = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1200px;
  margin: 1.5rem auto 0;
  padding: 0 1rem;
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: transparent;
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? "#ffd700" : "transparent")};
  color: ${({ $active }) => ($active ? "#ffd700" : "rgba(255, 255, 255, 0.6)")};
  padding: 0.8rem 1.4rem;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    color: #ffd700;
  }
`;

const TabContent = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1200px;
  margin: 1.5rem auto 0;
  padding: 0 1rem;
`;

const OverviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SectionTitle = styled.h3`
  font-family: "Montserrat", sans-serif;
  color: #ffd700;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.8rem;
`;

const SynopsisText = styled.p`
  font-family: "Inter", sans-serif;
  color: #d0d0d0;
  line-height: 1.7;
  font-size: 1rem;
`;

const ReadMoreBtn = styled.button`
  background: none;
  border: none;
  color: #ffd700;
  font-weight: 700;
  cursor: pointer;
  margin-left: 0.5rem;
`;

const GenresWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const GenreBadge = styled.span`
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  font-size: 0.8rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.8rem;
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.85rem;
  border-radius: 12px;
`;

const InfoLabel = styled.div`
  font-family: "Montserrat", sans-serif;
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  font-weight: 700;
`;

const InfoValue = styled.div`
  font-family: "Montserrat", sans-serif;
  font-size: 0.95rem;
  color: white;
  font-weight: 700;
  margin-top: 0.3rem;
`;

const TrailerSection = styled.div``;

const TrailerIframe = styled.iframe`
  width: 100%;
  max-width: 800px;
  aspect-ratio: 16 / 9;
  height: auto;
  border-radius: 16px;
  border: 2px solid rgba(255, 215, 0, 0.3);
`;

const EpisodesContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const EpisodesHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const EpisodeSearchWrapper = styled.div`
  position: relative;
  width: 280px;
`;

const EpisodeSearchInput = styled.input`
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.4rem;
  background: #1e1e20;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: white;
  font-size: 0.85rem;
  outline: none;

  &:focus {
    border-color: #ffd700;
  }
`;

const BatchContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
`;

const BatchButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? "#ffd700" : "rgba(255, 255, 255, 0.05)")};
  color: ${({ $active }) => ($active ? "#141414" : "#d0d0d0")};
  border: 1px solid ${({ $active }) => ($active ? "#ffd700" : "rgba(255, 255, 255, 0.1)")};
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
`;

const EpisodeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const EpisodeCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 215, 0, 0.4);
  }
`;

const EpisodeMediaWrapper = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  background: #0a0a0c;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const EpisodePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EpisodeBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #ffd700;
  color: #ffd700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.75rem;
`;

const EpisodePlayBtn = styled.a`
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e50914;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const EpisodeInfo = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
`;

const EpisodeTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EpisodeTitle = styled.h4`
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EpisodeSiteBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: #ffd700;
  text-transform: uppercase;
`;

const EpisodeSummaryText = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.8rem;
  color: #a0a0a0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CharacterCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.8rem;
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const CharacterImage = styled.img`
  width: 65px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const CharacterInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CharacterName = styled.div`
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CharacterRole = styled.div`
  font-size: 0.8rem;
  color: #ffd700;
  margin-top: 0.2rem;
`;

const VoiceActorInfo = styled.div`
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.3rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StaffGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StaffCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.8rem;
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const StaffImage = styled.img`
  width: 55px;
  height: 55px;
  border-radius: 50%;
  object-fit: cover;
`;

const StaffInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StaffName = styled.div`
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StaffPositions = styled.div`
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.2rem;
`;

const RelationGroup = styled.div`
  margin-bottom: 2.5rem;
`;

const RelationTypeHeader = styled.div`
  display: flex;
  align-items: center;
  font-family: "Montserrat", sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  color: #ffd700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;

  .count {
    color: #888;
    font-size: 0.9rem;
    margin-left: 0.4rem;
  }
`;

const RelationList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
`;

const RelationCard = styled(Link)`
  background: #1c1c1c;
  border: 2px solid #2e2e2e;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, border-color 0.3s ease;
  text-decoration: none;

  &:hover {
    transform: translateY(-6px);
    border-color: #ffd700;
  }
`;

const RelationCoverWrapper = styled.div`
  position: relative;
  aspect-ratio: 2 / 3;
  width: 100%;
  background: #121214;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .no-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #555;
    font-size: 0.8rem;
  }
`;

const RelationBadge = styled.span`
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 215, 0, 0.6);
  color: #ffd700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-family: "Montserrat", sans-serif;
  font-weight: 800;
  font-size: 0.7rem;
  text-transform: uppercase;
`;

const RelationScoreBadge = styled.span`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
`;

const RelationDetails = styled.div`
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
  justify-content: space-between;
`;

const RelationName = styled.div`
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: white;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
`;

const RelationMeta = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffd700;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #777;
  font-size: 0.9rem;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 2rem;
  color: #ffd700;
`;

const DiscussionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
`;

const CommentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.2rem;
  border-radius: 12px;
`;

const CommentInput = styled.textarea`
  width: 100%;
  min-height: 90px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  padding: 0.8rem;
  font-size: 0.9rem;
  outline: none;

  &:focus {
    border-color: #ffd700;
  }
`;

const CommentSubmitButton = styled.button`
  align-self: flex-start;
  background: linear-gradient(135deg, #ffd700 0%, #ffea00 100%);
  color: #141414;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
`;

const SignInPrompt = styled.div`
  padding: 1.2rem;
  text-align: center;
  background: rgba(255, 215, 0, 0.08);
  border: 1px dashed rgba(255, 215, 0, 0.4);
  border-radius: 12px;
  color: #ffd700;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CommentCard = styled.div`
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 1rem;
  border-radius: 12px;
`;

const UserAvatarSmall = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #222;
  border: 1px solid rgba(255, 215, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CommentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .author {
    font-family: "Montserrat", sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    color: white;
  }

  .date {
    font-size: 0.75rem;
    color: #666;
  }
`;

const CommentText = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: #d0d0d0;
  line-height: 1.5;
`;

const ReviewsContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
`;

const ReviewForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.2rem;
  border-radius: 12px;
`;

const ReviewFormHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .rating-label {
    font-family: "Montserrat", sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    color: #d0d0d0;
  }
`;

const RatingSelectWrapper = styled.div``;

const RatingSelect = styled.select`
  padding: 0.4rem 0.8rem;
  background: #252525;
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  color: #ffd700;
  font-weight: 700;
  font-size: 0.85rem;
  outline: none;
`;

const ReviewTextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  padding: 0.8rem;
  font-size: 0.9rem;
  outline: none;

  &:focus {
    border-color: #ffd700;
  }
`;

const ReviewSubmitButton = styled.button`
  align-self: flex-start;
  background: linear-gradient(135deg, #ffd700 0%, #ffea00 100%);
  color: #141414;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ReviewItemCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ReviewItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ReviewAuthorMeta = styled.div`
  display: flex;
  flex-direction: column;

  .name {
    font-family: "Montserrat", sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    color: white;
  }

  .date {
    font-size: 0.7rem;
    color: #666;
  }
`;

const ReviewScoreBadge = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.8rem;
`;

const ReviewBodyText = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: #d0d0d0;
  line-height: 1.5;
`;

const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.96);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  padding: 5rem 1.5rem 1.5rem;
`;

const LightboxContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const LightboxHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
`;

const LightboxCounter = styled.div`
  display: flex;
  align-items: center;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
`;

const LightboxTypeBadge = styled.span`
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  margin-left: 0.5rem;
  text-transform: uppercase;
`;

const LightboxCloseBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.2rem;
`;

const LightboxImageStage = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
`;

const LightboxMainImage = styled.img`
  max-width: 90vw;
  max-height: calc(75vh - 120px);
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
`;

const LightboxNavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;

  &.prev {
    left: 10px;
  }

  &.next {
    right: 10px;
  }
`;

const LightboxCaption = styled.div`
  text-align: center;
  padding: 0.5rem 0 0.25rem;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  color: #e0e0e0;
`;

const LightboxThumbnails = styled.div`
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding: 0.6rem 0.2rem;
  max-width: 100%;
  justify-content: flex-start;
  margin-top: auto;

  &::-webkit-scrollbar {
    height: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ffd700;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const LightboxThumbItem = styled.button<{ $active: boolean }>`
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid ${({ $active }) => ($active ? "#ffd700" : "rgba(255, 255, 255, 0.2)")};
  background: #111;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  opacity: ${({ $active }) => ($active ? 1 : 0.55)};

  &:hover {
    opacity: 1;
    border-color: #ffd700;
    transform: scale(1.06);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export default AnimeItem;
