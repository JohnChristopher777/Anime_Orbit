import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getAnimeDetailsCombined } from "../services/anilist";
import { useFavourites } from "../context/FavouritesContext.jsx";
import { useWatchlist } from "../context/WatchlistContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AuthModal from "./AuthModal.jsx";
import { db } from "../firebase/config.js";
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
  Clock,
  Tv,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Film,
  UserCheck,
  CheckCircle,
  ChevronDown,
  Image as ImageIcon,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";

function AnimeItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [anime, setAnime] = useState({});
  const [characters, setCharacters] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [relations, setRelations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showMore, setShowMore] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  // Lightbox Modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Discussion / Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(10);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { currentUser } = useAuth();
  const {
    updateAnimeStatus,
    getAnimeStatus,
    isInWatchlist,
    isWatched,
  } = useWatchlist();

  const {
    title,
    title_english,
    title_japanese,
    synopsis,
    trailer,
    duration,
    aired,
    season,
    images,
    rank,
    score,
    scored_by,
    popularity,
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
  const inWatchlist = mal_id ? isInWatchlist(mal_id) : false;
  const watched = mal_id ? isWatched(mal_id) : false;
  const currentStatus = mal_id ? getAnimeStatus(mal_id) : null;

  // Fetch anime data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data = await getAnimeDetailsCombined(id);
        setAnime(data.anime || {});
        setCharacters(data.characters?.slice(0, 16) || []);
        setEpisodes(data.episodes || []);
        setRelations(data.relations || []);
        setStaff(data.staff?.slice(0, 10) || []);
      } catch (error) {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  // Compute comprehensive image gallery from anime assets
  const galleryImages = useMemo(() => {
    const list = [];
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
        caption: `${displayTitle} - Official Banner Artwork`,
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
      rel.entry?.forEach((entry) => {
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

  const openLightboxAt = (imageUrl) => {
    if (!imageUrl) return;
    const index = galleryImages.findIndex((img) => img.url === imageUrl);
    if (index !== -1) {
      setLightboxIndex(index);
    } else {
      setLightboxIndex(0);
    }
    setLightboxOpen(true);
  };

  const nextLightboxImage = () => {
    if (galleryImages.length === 0) return;
    setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevLightboxImage = () => {
    if (galleryImages.length === 0) return;
    setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") nextLightboxImage();
      if (e.key === "ArrowLeft") prevLightboxImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, galleryImages.length]);

  // Fetch comments from Firestore
  useEffect(() => {
    if (!id) return;

    try {
      const commentsRef = collection(db, "comments");
      const q = query(
        commentsRef,
        where("animeId", "==", id.toString()),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedComments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setComments(fetchedComments);
          setCommentsLoading(false);
        },
        () => {
          setComments([]);
          setCommentsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      setCommentsLoading(false);
    }
  }, [id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    try {
      await addDoc(collection(db, "comments"), {
        animeId: id.toString(),
        userId: currentUser.uid,
        userName:
          currentUser.displayName ||
          currentUser.email.split("@")[0] ||
          "Anonymous",
        userAvatar: currentUser.photoURL || "",
        text: newComment.trim(),
        animeTitle: displayTitle,
        animeImage: images?.jpg?.large_image_url || images?.jpg?.image_url || "",
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      toast.success("Comment posted successfully!");
    } catch {
      toast.error("Failed to post comment. Try again!");
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

  // Click outside status dropdown listener
  useEffect(() => {
    const handleClickOutsideStatus = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideStatus);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideStatus);
  }, []);

  // Fetch reviews from Firestore
  useEffect(() => {
    if (!id) return;

    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("animeId", "==", id.toString()),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedReviews = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setReviews(fetchedReviews);
          setReviewsLoading(false);
        },
        () => {
          setReviews([]);
          setReviewsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      setReviewsLoading(false);
    }
  }, [id]);

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    try {
      await addDoc(collection(db, "reviews"), {
        animeId: id.toString(),
        userId: currentUser.uid,
        userName:
          currentUser.displayName ||
          currentUser.email.split("@")[0] ||
          "Anonymous",
        userAvatar: currentUser.photoURL || "",
        rating: Number(newReviewRating),
        text: newReviewText.trim(),
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
      // Ignored share abort
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Skeleton height={420} baseColor="#222" highlightColor="#333" borderRadius={16} />
        <div style={{ marginTop: "2rem" }}>
          <Skeleton count={4} height={24} baseColor="#222" highlightColor="#333" />
        </div>
      </LoadingContainer>
    );
  }

  return (
    <>
      <AnimeItemStyled>
        {/* Back Button */}
        <BackButton onClick={handleBack} aria-label="Go Back">
          <ArrowLeft size={20} />
          <span>Back</span>
        </BackButton>

        {/* Cinematic Backdrop Banner with smooth continuous fade */}
        <BackgroundImage
          style={{
            backgroundImage: `url(${anime.banner_image || images?.jpg?.large_image_url || ""})`,
          }}
          onClick={() =>
            openLightboxAt(anime.banner_image || images?.jpg?.large_image_url)
          }
          title="Click to view full image in Gallery"
        />
        <Overlay />

        <HeroSection
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PosterContainer>
            <PosterImage
              onClick={() => openLightboxAt(images?.jpg?.large_image_url)}
              title="Click to view full poster"
            >
              <img src={images?.jpg?.large_image_url} alt={displayTitle} />
              <ExpandBadge>
                <Maximize2 size={16} />
              </ExpandBadge>
            </PosterImage>
            {galleryImages.length > 1 && (
              <GalleryTriggerBtn onClick={() => setLightboxOpen(true)}>
                <ImageIcon size={16} />
                <span>Gallery ({galleryImages.length})</span>
              </GalleryTriggerBtn>
            )}
          </PosterContainer>

          <HeroContent>
            <TitleGroup>
              <MainTitle>{displayTitle}</MainTitle>
              {title_japanese && (
                <JapaneseTitle>{title_japanese}</JapaneseTitle>
              )}
            </TitleGroup>

            <MetaInfo>
              {score && (
                <MetaBadge className="score">
                  <Star size={18} fill="#ffd700" color="#ffd700" />
                  <span>{score}</span>
                </MetaBadge>
              )}

              {rank && (
                <MetaBadge>
                  <Award size={18} color="#ffd700" />
                  <span>Rank #{rank}</span>
                </MetaBadge>
              )}

              {type && (
                <MetaBadge>
                  <Tv size={18} color="#ffd700" />
                  <span>{type}</span>
                </MetaBadge>
              )}

              {totalEpisodes !== undefined && totalEpisodes !== null && (
                <MetaBadge>
                  <Film size={18} color="#ffd700" />
                  <span>
                    {totalEpisodes === 0 && status === "Airing"
                      ? "Ongoing"
                      : `${totalEpisodes}${anime.isOngoing ? "+ (Ongoing)" : " Episodes"}`}
                  </span>
                </MetaBadge>
              )}

              {year && (
                <MetaBadge>
                  <Calendar size={18} color="#ffd700" />
                  <span>{year}</span>
                </MetaBadge>
              )}
            </MetaInfo>

            <ActionButtons>
              <ActionButton
                onClick={handleFavouriteToggle}
                className={isFav ? "active" : ""}
              >
                <Heart size={20} fill={isFav ? "#ff4d4d" : "none"} />
                <span>{isFav ? "Favorited" : "Add Favorite"}</span>
              </ActionButton>

              <div style={{ position: "relative" }} ref={statusDropdownRef}>
                <ActionButton
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className={currentStatus ? "watched" : ""}
                >
                  <Bookmark
                    size={20}
                    fill={currentStatus ? "#27ae60" : "none"}
                  />
                  <span>
                    {currentStatus ? currentStatus : "Add to List"}
                  </span>
                  <ChevronDown size={16} />
                </ActionButton>

                {statusDropdownOpen && (
                  <StatusDropdownMenu>
                    {[
                      "Watching",
                      "Completed",
                      "Plan to Watch",
                      "On-Hold",
                      "Dropped",
                    ].map((opt) => (
                      <StatusDropdownItem
                        key={opt}
                        onClick={() => {
                          updateAnimeStatus(anime, opt);
                          setStatusDropdownOpen(false);
                        }}
                        className={currentStatus === opt ? "selected" : ""}
                      >
                        {opt}
                      </StatusDropdownItem>
                    ))}
                    {currentStatus && (
                      <>
                        <DropdownDivider />
                        <StatusDropdownItem
                          onClick={() => {
                            updateAnimeStatus(anime, null);
                            setStatusDropdownOpen(false);
                          }}
                          className="remove"
                        >
                          Remove from Tracker
                        </StatusDropdownItem>
                      </>
                    )}
                  </StatusDropdownMenu>
                )}
              </div>

              <ActionButton onClick={handleShare}>
                <Share2 size={20} />
                <span>Share</span>
              </ActionButton>
            </ActionButtons>
          </HeroContent>
        </HeroSection>

        <TabNavigation>
          <Tab
            $active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </Tab>
          <Tab
            $active={activeTab === "episodes"}
            onClick={() => setActiveTab("episodes")}
          >
            Episodes {totalEpisodes ? `(${totalEpisodes})` : ""}
          </Tab>
          <Tab
            $active={activeTab === "characters"}
            onClick={() => setActiveTab("characters")}
          >
            Characters
          </Tab>
          <Tab
            $active={activeTab === "staff"}
            onClick={() => setActiveTab("staff")}
          >
            Staff
          </Tab>
          <Tab
            $active={activeTab === "related"}
            onClick={() => setActiveTab("related")}
          >
            Related
          </Tab>
          <Tab
            $active={activeTab === "discussion"}
            onClick={() => setActiveTab("discussion")}
          >
            Discussion
          </Tab>
          <Tab
            $active={activeTab === "reviews"}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </Tab>
        </TabNavigation>

        <ContentSection>
          {activeTab === "overview" && (
            <OverviewTab
              anime={anime}
              synopsis={synopsis}
              showMore={showMore}
              setShowMore={setShowMore}
              genres={genres}
              studios={studios}
              producers={producers}
              trailer={trailer}
            />
          )}

          {activeTab === "episodes" && (
            <EpisodesTab
              episodes={episodes}
              totalEpisodes={totalEpisodes}
              onImageClick={openLightboxAt}
            />
          )}

          {activeTab === "characters" && (
            <CharactersTab
              characters={characters}
              onImageClick={openLightboxAt}
            />
          )}

          {activeTab === "staff" && <StaffTab staff={staff} />}

          {activeTab === "related" && (
            <RelatedTab relations={relations} />
          )}

          {activeTab === "discussion" && (
            <DiscussionTab
              comments={comments}
              commentsLoading={commentsLoading}
              newComment={newComment}
              setNewComment={setNewComment}
              handlePostComment={handlePostComment}
              currentUser={currentUser}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {activeTab === "reviews" && (
            <ReviewsTab
              reviews={reviews}
              reviewsLoading={reviewsLoading}
              newReviewText={newReviewText}
              setNewReviewText={setNewReviewText}
              newReviewRating={newReviewRating}
              setNewReviewRating={setNewReviewRating}
              handlePostReview={handlePostReview}
              currentUser={currentUser}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}
        </ContentSection>
      </AnimeItemStyled>

      {/* Lightbox Modal Gallery */}
      <AnimatePresence>
        {lightboxOpen && galleryImages.length > 0 && (
          <LightboxOverlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
          >
            <LightboxContainer onClick={(e) => e.stopPropagation()}>
              <LightboxHeader>
                <LightboxCounter>
                  <ImageIcon size={18} color="#ffd700" />
                  <span>
                    {lightboxIndex + 1} / {galleryImages.length}
                  </span>
                  <LightboxTypeBadge>
                    {galleryImages[lightboxIndex]?.type}
                  </LightboxTypeBadge>
                </LightboxCounter>
                <LightboxCloseBtn onClick={() => setLightboxOpen(false)}>
                  <X size={24} />
                </LightboxCloseBtn>
              </LightboxHeader>

              <LightboxImageStage>
                {galleryImages.length > 1 && (
                  <LightboxNavBtn
                    className="prev"
                    onClick={prevLightboxImage}
                    aria-label="Previous Image"
                  >
                    <ChevronLeft size={32} />
                  </LightboxNavBtn>
                )}

                <LightboxMainImage
                  key={lightboxIndex}
                  as={motion.img}
                  src={galleryImages[lightboxIndex]?.url}
                  alt={galleryImages[lightboxIndex]?.caption}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                />

                {galleryImages.length > 1 && (
                  <LightboxNavBtn
                    className="next"
                    onClick={nextLightboxImage}
                    aria-label="Next Image"
                  >
                    <ChevronRight size={32} />
                  </LightboxNavBtn>
                )}
              </LightboxImageStage>

              <LightboxCaption>
                <p>{galleryImages[lightboxIndex]?.caption}</p>
              </LightboxCaption>

              {/* Thumbnails strip */}
              {galleryImages.length > 1 && (
                <LightboxThumbnails>
                  {galleryImages.map((img, idx) => (
                    <LightboxThumbItem
                      key={idx}
                      $active={idx === lightboxIndex}
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <img src={img.url} alt={img.caption} />
                    </LightboxThumbItem>
                  ))}
                </LightboxThumbnails>
              )}
            </LightboxContainer>
          </LightboxOverlay>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

// Tab Components
const OverviewTab = ({
  anime,
  synopsis,
  showMore,
  setShowMore,
  genres,
  studios,
  producers,
  trailer,
}) => {
  const streamingLinks =
    anime.externalLinks?.filter((link) => link.type === "STREAMING") || [];

  return (
    <OverviewContent>
      <SynopsisSection>
        <SectionTitle>Synopsis</SectionTitle>
        <Synopsis>
          {synopsis ? (
            <>
              {showMore ? synopsis : `${synopsis.substring(0, 450)}...`}
              {synopsis.length > 450 && (
                <ReadMoreButton onClick={() => setShowMore(!showMore)}>
                  {showMore ? "Show Less" : "Read More"}
                </ReadMoreButton>
              )}
            </>
          ) : (
            "Synopsis not available"
          )}
        </Synopsis>

        {genres && genres.length > 0 && (
          <GenresContainer>
            {genres.map((genre) => (
              <GenreBadge key={genre.mal_id}>{genre.name}</GenreBadge>
            ))}
          </GenresContainer>
        )}
      </SynopsisSection>

      {streamingLinks.length > 0 && (
        <StreamingSection>
          <SectionTitle>Where to Watch</SectionTitle>
          <StreamingGrid>
            {streamingLinks.map((link) => (
              <StreamingButton
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{link.site}</span>
                <ExternalLink size={16} />
              </StreamingButton>
            ))}
          </StreamingGrid>
        </StreamingSection>
      )}

      <InfoGrid>
        <InfoCard>
          <InfoLabel>Studios</InfoLabel>
          <InfoValue>
            {studios && studios.length > 0
              ? studios.map((s) => s.name).join(", ")
              : "Toei Animation"}
          </InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Producers</InfoLabel>
          <InfoValue>
            {producers && producers.length > 0
              ? producers.slice(0, 3).map((p) => p.name).join(", ")
              : (studios && studios.length > 0 ? studios.map((s) => s.name).join(", ") : "Shueisha, Fuji TV")}
          </InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Source</InfoLabel>
          <InfoValue>{anime.source || "Manga"}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Duration</InfoLabel>
          <InfoValue>{anime.duration || "24 min"}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Status</InfoLabel>
          <InfoValue>{anime.status || "Finished Airing"}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Aired</InfoLabel>
          <InfoValue>{anime.aired?.string || "N/A"}</InfoValue>
        </InfoCard>
      </InfoGrid>

      {trailer && trailer.embed_url && (
        <TrailerSection>
          <SectionTitle>Official Trailer</SectionTitle>
          <TrailerIframe
            src={trailer.embed_url}
            title="Anime Trailer"
            allowFullScreen
          />
        </TrailerSection>
      )}
    </OverviewContent>
  );
};

// Episodes Tab with Batch Filter & Search for 1000+ ep anime (e.g. One Piece)
const EpisodesTab = ({ episodes, totalEpisodes, onImageClick }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(0); // 0 = first 50, 1 = 51-100, etc.

  const batchSize = 50;
  const count = episodes.length;

  const batches = useMemo(() => {
    if (count <= batchSize) return [];
    const numBatches = Math.ceil(count / batchSize);
    const list = [];
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize + 1;
      const end = Math.min((i + 1) * batchSize, count);
      list.push({ index: i, label: `${start} - ${end}`, start, end });
    }
    return list;
  }, [count]);

  const displayedEpisodes = useMemo(() => {
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

  return (
    <EpisodesContent>
      <EpisodesHeaderRow>
        <SectionTitle style={{ margin: 0 }}>
          Episodes ({totalEpisodes || episodes.length})
        </SectionTitle>

        <EpisodeSearchWrapper>
          <Search size={16} color="rgba(255,255,255,0.4)" />
          <EpisodeSearchInput
            type="text"
            placeholder="Jump to episode # or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </EpisodeSearchWrapper>
      </EpisodesHeaderRow>

      {/* Batch Navigation Tabs for large series */}
      {batches.length > 0 && !searchQuery.trim() && (
        <BatchContainer>
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
        <EpisodeGrid>
          {displayedEpisodes.map((episode) => (
            <EpisodeCard key={episode.mal_id}>
              <EpisodeMediaWrapper
                onClick={() =>
                  episode.thumbnail && onImageClick(episode.thumbnail)
                }
                style={{ cursor: episode.thumbnail ? "pointer" : "default" }}
              >
                {episode.thumbnail ? (
                  <img src={episode.thumbnail} alt={episode.title} />
                ) : (
                  <EpisodePlaceholder>
                    <Film size={28} color="#ffd700" />
                  </EpisodePlaceholder>
                )}
                <EpisodeBadge>EP {episode.mal_id}</EpisodeBadge>
                {episode.url && (
                  <EpisodePlayBtn
                    href={episode.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Watch Episode"
                  >
                    <Play size={16} fill="white" color="white" />
                  </EpisodePlayBtn>
                )}
              </EpisodeMediaWrapper>

              <EpisodeInfo>
                <EpisodeTitleRow>
                  <EpisodeTitle>
                    {episode.title || `Episode ${episode.mal_id}`}
                  </EpisodeTitle>
                  {episode.site && (
                    <EpisodeSiteBadge>{episode.site}</EpisodeSiteBadge>
                  )}
                </EpisodeTitleRow>
                <EpisodeSummaryText>
                  {episode.summary ||
                    `Official Episode ${episode.mal_id} broadcast.`}
                </EpisodeSummaryText>
              </EpisodeInfo>
            </EpisodeCard>
          ))}
        </EpisodeGrid>
      ) : (
        <EmptyState>
          {searchQuery
            ? "No episodes match your search query."
            : "No episode information available"}
        </EmptyState>
      )}
    </EpisodesContent>
  );
};

const CharactersTab = ({ characters, onImageClick }) => (
  <CharactersContent>
    <SectionTitle>Characters & Voice Actors</SectionTitle>
    {characters.length > 0 ? (
      <CharacterGrid>
        {characters.map((char, index) => (
          <CharacterCard key={index}>
            <CharacterImage
              src={char.character?.images?.jpg?.image_url}
              alt={char.character?.name}
              onClick={() =>
                char.character?.images?.jpg?.image_url &&
                onImageClick(char.character.images.jpg.image_url)
              }
              style={{ cursor: "pointer" }}
              title="Click to view in Gallery"
            />
            <CharacterInfo>
              <CharacterName>{char.character?.name}</CharacterName>
              <CharacterRole>{char.role}</CharacterRole>
              {char.voice_actors && char.voice_actors.length > 0 && (
                <VoiceActorInfo>
                  <span className="label">VA:</span>
                  <span className="name">
                    {char.voice_actors[0].person?.name}
                  </span>
                </VoiceActorInfo>
              )}
            </CharacterInfo>
          </CharacterCard>
        ))}
      </CharacterGrid>
    ) : (
      <EmptyState>No character information available</EmptyState>
    )}
  </CharactersContent>
);

const StaffTab = ({ staff }) => (
  <StaffContent>
    <SectionTitle>Production Staff</SectionTitle>
    {staff.length > 0 ? (
      <StaffGrid>
        {staff.map((person, index) => (
          <StaffCard key={index}>
            <StaffImage
              src={person.person?.images?.jpg?.image_url}
              alt={person.person?.name}
            />
            <StaffInfo>
              <StaffName>{person.person?.name}</StaffName>
              <StaffPositions>{person.positions.join(", ")}</StaffPositions>
            </StaffInfo>
          </StaffCard>
        ))}
      </StaffGrid>
    ) : (
      <EmptyState>No staff information available</EmptyState>
    )}
  </StaffContent>
);

// Related Tab with Full Portrait Posters and Group Ordering
const RelatedTab = ({ relations }) => (
  <RelatedContent>
    {relations.length > 0 ? (
      relations.map((relation, index) => (
        <RelationGroup key={index}>
          <RelationTypeHeader>
            <BookOpen size={20} color="#ffd700" />
            <span>{relation.relation}</span>
            <span className="count">({relation.entry.length})</span>
          </RelationTypeHeader>

          <RelationList>
            {relation.entry.map((entry) => (
              <RelationCard key={entry.mal_id} to={`/anime/${entry.mal_id}`}>
                <RelationCoverWrapper>
                  {entry.image ? (
                    <img src={entry.image} alt={entry.name} loading="lazy" />
                  ) : (
                    <div className="placeholder">
                      <Film size={32} color="#ffd700" />
                    </div>
                  )}
                  <RelationBadge>{relation.relation}</RelationBadge>
                  {entry.score && (
                    <RelationScoreBadge>
                      <Star size={12} fill="#ffd700" color="#ffd700" />
                      <span>{entry.score}</span>
                    </RelationScoreBadge>
                  )}
                </RelationCoverWrapper>

                <RelationDetails>
                  <RelationName>{entry.name}</RelationName>
                  <RelationMeta>
                    <span className="type">{entry.type || "Anime"}</span>
                    {entry.status && <span className="status">{entry.status}</span>}
                  </RelationMeta>
                </RelationDetails>
              </RelationCard>
            ))}
          </RelationList>
        </RelationGroup>
      ))
    ) : (
      <EmptyState>No related series available</EmptyState>
    )}
  </RelatedContent>
);

// Discussion Tab Component
const DiscussionTab = ({
  comments,
  commentsLoading,
  newComment,
  setNewComment,
  handlePostComment,
  currentUser,
  onOpenAuth,
}) => (
  <DiscussionContent>
    <SectionTitle>Discussion & Community</SectionTitle>

    {currentUser ? (
      <CommentForm onSubmit={handlePostComment}>
        <UserAvatarSmall>
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} alt="User Avatar" />
          ) : (
            <UserCheck size={20} />
          )}
        </UserAvatarSmall>
        <CommentInput
          placeholder="Share your thoughts about this episode or series..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <CommentSubmitButton type="submit">Post Comment</CommentSubmitButton>
      </CommentForm>
    ) : (
      <SignInPrompt onClick={onOpenAuth}>
        <span>Sign in to join the conversation and post a comment!</span>
      </SignInPrompt>
    )}

    {commentsLoading ? (
      <LoadingText>Loading discussion...</LoadingText>
    ) : comments.length > 0 ? (
      <CommentsList>
        {comments.map((comment) => (
          <CommentCard key={comment.id}>
            <UserAvatarSmall>
              {comment.userAvatar ? (
                <img src={comment.userAvatar} alt={comment.userName} />
              ) : (
                <UserCheck size={18} />
              )}
            </UserAvatarSmall>
            <CommentBody>
              <CommentHeader>
                <span className="username">{comment.userName}</span>
                <span className="timestamp">
                  {comment.createdAt?.toDate
                    ? comment.createdAt.toDate().toLocaleDateString()
                    : "Recently"}
                </span>
              </CommentHeader>
              <CommentText>{comment.text}</CommentText>
            </CommentBody>
          </CommentCard>
        ))}
      </CommentsList>
    ) : (
      <EmptyState>
        No comments yet. Be the first to share your thoughts!
      </EmptyState>
    )}
  </DiscussionContent>
);

// Reviews Tab Component
const ReviewsTab = ({
  reviews,
  reviewsLoading,
  newReviewText,
  setNewReviewText,
  newReviewRating,
  setNewReviewRating,
  handlePostReview,
  currentUser,
  onOpenAuth,
}) => (
  <ReviewsContent>
    <SectionTitle>User Reviews & Ratings</SectionTitle>

    {currentUser ? (
      <ReviewForm onSubmit={handlePostReview}>
        <ReviewFormHeader>
          <UserAvatarSmall>
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="User Avatar" />
            ) : (
              <UserCheck size={20} />
            )}
          </UserAvatarSmall>
          <RatingSelectWrapper>
            <span>Your Rating:</span>
            <RatingSelect
              value={newReviewRating}
              onChange={(e) => setNewReviewRating(e.target.value)}
            >
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} / 10 Star{r > 1 ? "s" : ""}
                </option>
              ))}
            </RatingSelect>
          </RatingSelectWrapper>
        </ReviewFormHeader>

        <ReviewTextArea
          placeholder="Write your comprehensive anime review..."
          value={newReviewText}
          onChange={(e) => setNewReviewText(e.target.value)}
        />
        <ReviewSubmitButton type="submit">Submit Review</ReviewSubmitButton>
      </ReviewForm>
    ) : (
      <SignInPrompt onClick={onOpenAuth}>
        <span>Sign in to write and publish your anime review!</span>
      </SignInPrompt>
    )}

    {reviewsLoading ? (
      <LoadingText>Loading reviews...</LoadingText>
    ) : reviews.length > 0 ? (
      <ReviewsList>
        {reviews.map((rev) => (
          <ReviewItemCard key={rev.id}>
            <ReviewItemHeader>
              <UserAvatarSmall>
                {rev.userAvatar ? (
                  <img src={rev.userAvatar} alt={rev.userName} />
                ) : (
                  <UserCheck size={18} />
                )}
              </UserAvatarSmall>
              <ReviewAuthorMeta>
                <span className="username">{rev.userName}</span>
                <span className="date">
                  {rev.createdAt?.toDate
                    ? rev.createdAt.toDate().toLocaleDateString()
                    : "Recently"}
                </span>
              </ReviewAuthorMeta>
              <ReviewScoreBadge>
                <Star size={14} fill="#ffd700" color="#ffd700" />
                <span>{rev.rating} / 10</span>
              </ReviewScoreBadge>
            </ReviewItemHeader>
            <ReviewBodyText>{rev.text}</ReviewBodyText>
          </ReviewItemCard>
        ))}
      </ReviewsList>
    ) : (
      <EmptyState>No user reviews written yet. Leave the first one!</EmptyState>
    )}
  </ReviewsContent>
);

// Styled Components
const LoadingContainer = styled.div`
  padding: 3rem 1.5rem;
  max-width: 1300px;
  margin: 0 auto;
`;

const AnimeItemStyled = styled.div`
  position: relative;
  min-height: 100vh;
  background: #141414;
  padding-bottom: 4rem;
  overflow-x: hidden;
`;

const BackgroundImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 640px;
  background-size: cover;
  background-position: center 20%;
  opacity: 0.4;
  filter: blur(1.5px);
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0.8) 60%,
    rgba(0, 0, 0, 0) 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0.8) 60%,
    rgba(0, 0, 0, 0) 100%
  );
  z-index: 0;
  cursor: pointer;
  transition: opacity 0.4s ease;

  &:hover {
    opacity: 0.5;
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 640px;
  background: linear-gradient(
    180deg,
    rgba(20, 20, 20, 0.3) 0%,
    rgba(20, 20, 20, 0.75) 60%,
    #141414 100%
  );
  z-index: 1;
  pointer-events: none;
`;

const PosterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 280px;

  @media (max-width: 968px) {
    width: 240px;
  }
`;

const PosterImage = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
  border: 3px solid rgba(255, 215, 0, 0.35);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.04);
  }

  &:hover > div {
    opacity: 1;
  }
`;

const ExpandBadge = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  padding: 0.4rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
`;

const GalleryTriggerBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1.5px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.55rem 1rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  justify-content: center;

  &:hover {
    background: #ffd700;
    color: #1a1a1a;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
    transform: translateY(-2px);
  }
`;

const BackButton = styled.button`
  position: fixed;
  top: 6rem;
  left: 2rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(20, 20, 20, 0.9);
  backdrop-filter: blur(10px);
  border: 1.5px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.6rem 1.2rem;
  border-radius: 25px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.15);
    transform: translateX(-4px);
  }
`;

const HeroSection = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1350px;
  margin: 5.5rem auto 2rem;
  padding: 2rem 2.5rem;
  display: flex;
  gap: 3rem;

  @media (max-width: 968px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem;
  }
`;

const HeroContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TitleGroup = styled.div``;

const MainTitle = styled.h1`
  font-family: "Staatliches", cursive;
  font-size: 3.4rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
  line-height: 1.1;
  letter-spacing: 0.03em;

  @media (max-width: 968px) {
    font-size: 2.4rem;
  }
`;

const JapaneseTitle = styled.h2`
  font-family: "Noto Sans JP", sans-serif;
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
  margin: 0;
`;

const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  @media (max-width: 968px) {
    justify-content: center;
  }
`;

const MetaBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.45rem 0.9rem;
  border-radius: 20px;
  color: white;
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  font-weight: 700;

  &.score {
    background: rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.4);
    color: #ffd700;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 968px) {
    justify-content: center;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: white;
  padding: 0.75rem 1.4rem;
  border-radius: 25px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &.active {
    background: rgba(255, 77, 77, 0.2);
    border-color: #ff4d4d;
    color: #ff6b6b;
  }

  &.watched {
    background: rgba(39, 174, 96, 0.2);
    border-color: #27ae60;
    color: #2ecc71;
  }

  &:hover {
    background: rgba(255, 215, 0, 0.15);
    border-color: #ffd700;
    color: #ffd700;
    transform: translateY(-2px);
  }
`;

const StatusDropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: #1c1c1c;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
  z-index: 50;
  min-width: 180px;
`;

const StatusDropdownItem = styled.div`
  padding: 0.7rem 1.2rem;
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.15);
    color: #ffd700;
  }

  &.selected {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
  }

  &.remove {
    color: #ff6b6b;
    &:hover {
      background: rgba(255, 77, 77, 0.2);
    }
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
`;

const TabNavigation = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1350px;
  margin: 0 auto 2rem;
  padding: 0 2.5rem;
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 4px;
  }
`;

const Tab = styled.button`
  background: ${({ $active }) =>
    $active ? "rgba(255, 215, 0, 0.12)" : "transparent"};
  border: none;
  border-bottom: 3px solid
    ${({ $active }) => ($active ? "#ffd700" : "transparent")};
  color: ${({ $active }) => ($active ? "#ffd700" : "rgba(255, 255, 255, 0.65)")};
  padding: 0.9rem 1.8rem;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;

  &:hover {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.08);
  }
`;

const ContentSection = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1350px;
  margin: 0 auto;
  padding: 0 2.5rem;

  @media (max-width: 968px) {
    padding: 0 1.5rem;
  }
`;

const OverviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

const SectionTitle = styled.h3`
  font-family: "Montserrat", sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
  color: #ffd700;
  margin: 0 0 1rem 0;
  letter-spacing: 0.03em;
`;

const SynopsisSection = styled.div``;

const Synopsis = styled.p`
  font-family: "Inter", "Noto Sans JP", sans-serif;
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 1.5rem;
`;

const ReadMoreButton = styled.button`
  background: none;
  border: none;
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  margin-left: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

const GenresContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const GenreBadge = styled.span`
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
`;

const StreamingSection = styled.div``;

const StreamingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const StreamingButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  padding: 0.9rem 1.2rem;
  border-radius: 12px;
  text-decoration: none;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.15);
    border-color: #ffd700;
    color: #ffd700;
    transform: translateY(-2px);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  padding: 1.2rem;
  border-radius: 12px;
`;

const InfoLabel = styled.div`
  font-family: "Montserrat", sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  margin-bottom: 0.4rem;
  letter-spacing: 0.05em;
`;

const InfoValue = styled.div`
  font-family: "Montserrat", sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: white;
`;

const TrailerSection = styled.div``;

const TrailerIframe = styled.iframe`
  width: 100%;
  height: 480px;
  border: none;
  border-radius: 16px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);

  @media (max-width: 768px) {
    height: 280px;
  }
`;

// Episodes Tab Styles
const EpisodesContent = styled.div``;

const EpisodesHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const EpisodeSearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  min-width: 260px;

  svg {
    position: absolute;
    left: 1rem;
    pointer-events: none;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const EpisodeSearchInput = styled.input`
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.6rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  color: white;
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const BatchContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 4px;
  }
`;

const BatchButton = styled.button`
  background: ${({ $active }) =>
    $active ? "#ffd700" : "rgba(255, 255, 255, 0.04)"};
  color: ${({ $active }) => ($active ? "#1a1a1a" : "rgba(255, 255, 255, 0.8)")};
  border: 1px solid
    ${({ $active }) => ($active ? "#ffd700" : "rgba(255, 255, 255, 0.1)")};
  padding: 0.4rem 0.9rem;
  border-radius: 16px;
  font-family: "Montserrat", sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    border-color: #ffd700;
  }
`;

const EpisodeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const EpisodeCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 215, 0, 0.3);
    transform: translateY(-3px);
  }
`;

const EpisodeMediaWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 160px;
  background: #181818;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
`;

const EpisodePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 215, 0, 0.04);
`;

const EpisodeBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #ffd700;
  color: #ffd700;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-family: "Montserrat", sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
`;

const EpisodePlayBtn = styled.a`
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 77, 77, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.15);
    background: #ff4d4d;
  }
`;

const EpisodeInfo = styled.div`
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const EpisodeTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const EpisodeTitle = styled.h4`
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  color: white;
  font-size: 0.95rem;
  margin: 0;
`;

const EpisodeSiteBadge = styled.span`
  font-family: "Inter", sans-serif;
  font-size: 0.75rem;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  text-transform: capitalize;
`;

const EpisodeSummaryText = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CharactersContent = styled.div``;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
`;

const CharacterCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0.75rem;
  gap: 1rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 215, 0, 0.3);
    transform: translateY(-2px);
  }
`;

const CharacterImage = styled.img`
  width: 70px;
  height: 95px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.3);
`;

const CharacterInfo = styled.div`
  flex: 1;
`;

const CharacterName = styled.div`
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  color: white;
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
`;

const CharacterRole = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 0.8rem;
  color: #ffd700;
  margin-bottom: 0.4rem;
`;

const VoiceActorInfo = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);

  .label {
    margin-right: 0.3rem;
  }
  .name {
    color: rgba(255, 255, 255, 0.8);
  }
`;

const StaffContent = styled.div``;

const StaffGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
`;

const StaffCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.8rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StaffImage = styled.img`
  width: 55px;
  height: 55px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 215, 0, 0.3);
`;

const StaffInfo = styled.div`
  flex: 1;
`;

const StaffName = styled.div`
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  color: white;
  margin-bottom: 0.2rem;
`;

const StaffPositions = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`;

// Related Tab Styles with full portrait cards
const RelatedContent = styled.div``;

const RelationGroup = styled.div`
  margin-bottom: 3rem;
`;

const RelationTypeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: "Montserrat", sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffd700;
  margin-bottom: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  .count {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.9rem;
  }
`;

const RelationList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const RelationCard = styled(Link)`
  background: #1c1c1c;
  border: 2px solid #2e2e2e;
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    border-color: #ffd700;
    transform: translateY(-6px);
    box-shadow: 0 10px 25px rgba(255, 215, 0, 0.2);
  }
`;

const RelationCoverWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: #111;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }

  .placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 215, 0, 0.05);
  }
`;

const RelationBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #ffd700;
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const RelationScoreBadge = styled.span`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 215, 0, 0.5);
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const RelationDetails = styled.div`
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
`;

const RelationName = styled.div`
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  color: white;
  font-size: 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  height: 2.3rem;
`;

const RelationMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  font-family: "Inter", sans-serif;
  font-size: 0.8rem;

  .type {
    color: #ffd700;
    font-weight: 700;
  }
  .status {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: "Montserrat", sans-serif;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 2px dashed rgba(255, 255, 255, 0.08);
  border-radius: 16px;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 2rem;
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
`;

// Discussion & Community Tab Styles
const DiscussionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CommentForm = styled.form`
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.25rem;
  border-radius: 14px;
  align-items: flex-start;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const UserAvatarSmall = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  background: #252525;
  border: 2px solid rgba(255, 215, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffd700;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CommentInput = styled.textarea`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: white;
  border-radius: 10px;
  padding: 0.8rem;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 80px;
  outline: none;

  &:focus {
    border-color: #ffd700;
  }
`;

const CommentSubmitButton = styled.button`
  background: linear-gradient(135deg, #ffd700 0%, #ffea00 100%);
  color: #1a1a1a;
  border: none;
  padding: 0.7rem 1.4rem;
  font-family: "Montserrat", sans-serif;
  font-weight: 800;
  font-size: 0.9rem;
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  }
`;

const SignInPrompt = styled.div`
  padding: 1.5rem;
  text-align: center;
  background: rgba(255, 215, 0, 0.06);
  border: 2px dashed rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.12);
  }
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
  padding: 1.2rem;
  border-radius: 12px;
`;

const CommentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .username {
    font-family: "Montserrat", sans-serif;
    font-weight: 700;
    color: white;
  }
  .timestamp {
    font-family: "Inter", sans-serif;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
  }
`;

const CommentText = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0;
`;

// Reviews Tab Styles
const ReviewsContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ReviewForm = styled.form`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ReviewFormHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
`;

const RatingSelectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  font-family: "Montserrat", sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
`;

const RatingSelect = styled.select`
  padding: 0.5rem 1rem;
  background: #252525;
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  border-radius: 10px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  outline: none;
`;

const ReviewTextArea = styled.textarea`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: white;
  border-radius: 10px;
  padding: 1rem;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  min-height: 100px;
  outline: none;

  &:focus {
    border-color: #ffd700;
  }
`;

const ReviewSubmitButton = styled.button`
  align-self: flex-start;
  background: linear-gradient(135deg, #ffd700 0%, #ffea00 100%);
  color: #1a1a1a;
  border: none;
  padding: 0.7rem 1.6rem;
  font-family: "Montserrat", sans-serif;
  font-weight: 800;
  font-size: 0.9rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  }
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const ReviewItemCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 1.5rem;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const ReviewItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ReviewAuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;

  .username {
    font-family: "Montserrat", sans-serif;
    font-weight: 700;
    color: white;
  }
  .date {
    font-family: "Inter", sans-serif;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
  }
`;

const ReviewScoreBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  padding: 0.35rem 0.8rem;
  border-radius: 12px;
  font-family: "Montserrat", sans-serif;
  font-weight: 800;
  font-size: 0.85rem;
`;

const ReviewBodyText = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
  margin: 0;
`;

// Lightbox Styled Components
const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(15px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const LightboxContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 1000px;
  height: 90vh;
  display: flex;
  flex-direction: column;
`;

const LightboxHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0 1rem;
`;

const LightboxCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: "Montserrat", sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: white;
`;

const LightboxTypeBadge = styled.span`
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  text-transform: uppercase;
`;

const LightboxCloseBtn = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #ffd700;
    transform: rotate(90deg);
  }
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
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
`;

const LightboxNavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.6);
  border: 1.5px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;

  &.prev {
    left: 10px;
  }
  &.next {
    right: 10px;
  }

  &:hover {
    background: #ffd700;
    color: #1a1a1a;
    transform: translateY(-50%) scale(1.1);
  }
`;

const LightboxCaption = styled.div`
  text-align: center;
  padding: 0.75rem 0 0.5rem;

  p {
    font-family: "Montserrat", sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }
`;

const LightboxThumbnails = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
  justify-content: center;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 4px;
  }
`;

const LightboxThumbItem = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid
    ${({ $active }) => ($active ? "#ffd700" : "rgba(255, 255, 255, 0.2)")};
  opacity: ${({ $active }) => ($active ? 1 : 0.5)};
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  background: black;
  transition: all 0.2s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    opacity: 1;
    border-color: #ffd700;
  }
`;

export default AnimeItem;