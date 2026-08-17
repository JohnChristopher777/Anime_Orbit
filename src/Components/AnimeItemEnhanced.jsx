import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import styled from "styled-components";
import {
  Heart,
  Play,
  ArrowLeft,
  Star,
  Calendar,
  Film,
  Users,
  MessageCircle,
  Share2,
  Bookmark,
  CheckCircle,
  TrendingUp,
  Award,
  Globe,
  ExternalLink,
  User,
  ChevronDown,
} from "lucide-react";
import { useFavourites } from "../context/FavouritesContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useWatchlist } from "../context/WatchlistContext.jsx";
import AuthModal from "./AuthModal.jsx";
import Breadcrumbs from "./Breadcrumbs.jsx";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { getAnimeDetailsCombined } from "../services/anilist";
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

function AnimeItemEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [anime, setAnime] = useState({});
  const [characters, setCharacters] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [relations, setRelations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Status Tracker Dropdown States
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const statusOptions = [
    "Plan to Watch",
    "Watching",
    "Completed",
    "On-Hold",
    "Dropped"
  ];

  // Comments States
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Reviews States
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

  const detailsRef = useRef(null);

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
    rating,
    source,
    episodes: totalEpisodes,
    genres,
    mal_id,
    studios,
    producers,
    licensors,
    type,
    year,
  } = anime || {};

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
        setCharacters(data.characters?.slice(0, 12) || []);
        setEpisodes(data.episodes || []);
        setRelations(data.relations || []);
        setStaff(data.staff?.slice(0, 8) || []);
      } catch (error) {
        console.error("Error fetching data from AniList:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  // Fetch comments from Firestore
  useEffect(() => {
    if (!id) return;

    const commentsRef = collection(db, "comments");
    const q = query(
      commentsRef,
      where("animeId", "==", id),
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
      (error) => {
        console.error("Error listening to comments:", error);
        setCommentsLoading(false);
      }
    );

    return () => unsubscribe();
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
        animeId: id,
        userId: currentUser.uid,
        userName:
          currentUser.displayName ||
          currentUser.email.split("@")[0] ||
          "Anonymous",
        userAvatar: currentUser.photoURL || "",
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      toast.success("Comment posted successfully!");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment. Try again!");
    }
  };

  const handleBack = () => {
    // If there's browsing history, go back; otherwise navigate home
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

    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("animeId", "==", id),
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
      (error) => {
        console.error("Error listening to reviews:", error);
        setReviewsLoading(false);
      }
    );

    return () => unsubscribe();
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
        animeId: id,
        userId: currentUser.uid,
        userName:
          currentUser.displayName ||
          currentUser.email.split("@")[0] ||
          "Anonymous",
        userAvatar: currentUser.photoURL || "",
        rating: Number(newReviewRating),
        text: newReviewText.trim(),
        animeTitle: title_english || title || "Unknown Anime",
        animeImage: images?.jpg?.large_image_url || images?.jpg?.image_url || "",
        createdAt: serverTimestamp(),
      });
      setNewReviewText("");
      setNewReviewRating(10);
      toast.success("Review posted successfully!");
    } catch (error) {
      console.error("Error posting review:", error);
      toast.error("Failed to post review. Try again!");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: title_english || title,
      text: `Check out ${title_english || title} on Anime Orbit!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const displayTitle = title_english || title || "Anime Title Not Available";

  if (loading) {
    return (
      <LoadingContainer>
        <Skeleton height={400} baseColor="#2c2c2c" highlightColor="#3a3a3a" />
        <Skeleton count={5} baseColor="#2c2c2c" highlightColor="#3a3a3a" />
      </LoadingContainer>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${displayTitle} - Anime Orbit`}</title>
        <meta name="description" content={synopsis?.substring(0, 160)} />
        <meta property="og:title" content={`${displayTitle} - Anime Orbit`} />
        <meta property="og:image" content={images?.jpg?.large_image_url} />
      </Helmet>

      <Breadcrumbs />

      <AnimeItemStyled>
        <BackButton onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </BackButton>

        {images?.jpg?.large_image_url && (
          <BackgroundImage
            style={{ backgroundImage: `url(${images.jpg.large_image_url})` }}
          />
        )}
        <Overlay />

        <HeroSection
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PosterImage>
            <img src={images?.jpg?.large_image_url} alt={displayTitle} />
          </PosterImage>

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
                  <Award size={18} />
                  <span>Rank #{rank}</span>
                </MetaBadge>
              )}
              {type && (
                <MetaBadge>
                  <Film size={18} />
                  <span>{type}</span>
                </MetaBadge>
              )}
              {totalEpisodes && (
                <MetaBadge>
                  <span>{totalEpisodes} Episodes</span>
                </MetaBadge>
              )}
              {year && (
                <MetaBadge>
                  <Calendar size={18} />
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
                <span>{isFav ? "Remove Favorite" : "Add Favorite"}</span>
              </ActionButton>

              <div style={{ position: 'relative' }} ref={statusDropdownRef}>
                <ActionButton
                  onClick={() => {
                    if (!currentUser) {
                      setAuthModalOpen(true);
                    } else {
                      setStatusDropdownOpen(!statusDropdownOpen);
                    }
                  }}
                  className={currentStatus ? "active" : ""}
                >
                  <Bookmark size={20} fill={currentStatus ? "#ffd700" : "none"} />
                  <span>{currentStatus || "Add to List"}</span>
                  <ChevronDown size={16} style={{ marginLeft: '4px' }} />
                </ActionButton>

                {statusDropdownOpen && (
                  <StatusDropdownMenu>
                    {statusOptions.map((opt) => (
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
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </Tab>
          <Tab
            active={activeTab === "episodes"}
            onClick={() => setActiveTab("episodes")}
          >
            Episodes
          </Tab>
          <Tab
            active={activeTab === "characters"}
            onClick={() => setActiveTab("characters")}
          >
            Characters
          </Tab>
          <Tab
            active={activeTab === "staff"}
            onClick={() => setActiveTab("staff")}
          >
            Staff
          </Tab>
          <Tab
            active={activeTab === "related"}
            onClick={() => setActiveTab("related")}
          >
            Related
          </Tab>
          <Tab
            active={activeTab === "comments"}
            onClick={() => setActiveTab("comments")}
          >
            Discussion
          </Tab>
          <Tab
            active={activeTab === "reviews"}
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
            <EpisodesTab episodes={episodes} totalEpisodes={totalEpisodes} />
          )}

          {activeTab === "characters" && (
            <CharactersTab characters={characters} />
          )}

          {activeTab === "staff" && <StaffTab staff={staff} />}

          {activeTab === "related" && <RelatedTab relations={relations} />}

          {activeTab === "comments" && (
            <CommentsTab
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
  const streamingLinks = anime.externalLinks?.filter(link => link.type === "STREAMING") || [];

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
          <InfoValue>{studios?.map((s) => s.name).join(", ") || "N/A"}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Producers</InfoLabel>
          <InfoValue>
            {producers
              ?.slice(0, 3)
              .map((p) => p.name)
              .join(", ") || "N/A"}
          </InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Source</InfoLabel>
          <InfoValue>{anime.source || "N/A"}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Duration</InfoLabel>
          <InfoValue>{anime.duration || "N/A"}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Status</InfoLabel>
          <InfoValue>{anime.status || "N/A"}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Rating</InfoLabel>
          <InfoValue>{anime.rating || "N/A"}</InfoValue>
        </InfoCard>
      </InfoGrid>

      {trailer?.embed_url && (
        <TrailerSection>
          <SectionTitle>Trailer</SectionTitle>
          <TrailerFrame
            src={trailer.embed_url}
            title="Anime Trailer"
            allowFullScreen
          />
        </TrailerSection>
      )}
    </OverviewContent>
  );
};

const EpisodesTab = ({ episodes, totalEpisodes }) => (
  <EpisodesContent>
    <SectionTitle>Episodes ({totalEpisodes || episodes.length})</SectionTitle>
    {episodes.length > 0 ? (
      <EpisodeList>
        {episodes.map((episode) => (
          <EpisodeCard key={episode.mal_id}>
            <EpisodeNumber>EP {episode.mal_id}</EpisodeNumber>
            <EpisodeInfo>
              <EpisodeTitle>
                {episode.title || `Episode ${episode.mal_id}`}
              </EpisodeTitle>
              {episode.aired && (
                <EpisodeDate>
                  {new Date(episode.aired).toLocaleDateString()}
                </EpisodeDate>
              )}
            </EpisodeInfo>
          </EpisodeCard>
        ))}
      </EpisodeList>
    ) : (
      <EmptyState>No episode information available</EmptyState>
    )}
  </EpisodesContent>
);

const CharactersTab = ({ characters }) => (
  <CharactersContent>
    <SectionTitle>Characters & Voice Actors</SectionTitle>
    {characters.length > 0 ? (
      <CharacterGrid>
        {characters.map((char, index) => (
          <CharacterCard key={index}>
            <CharacterImage
              src={char.character?.images?.jpg?.image_url}
              alt={char.character?.name}
            />
            <CharacterInfo>
              <CharacterName>{char.character?.name}</CharacterName>
              <CharacterRole>{char.role}</CharacterRole>
              {char.voice_actors && char.voice_actors.length > 0 && (
                <VoiceActor>
                  <VoiceActorImage
                    src={char.voice_actors[0].person?.images?.jpg?.image_url}
                    alt={char.voice_actors[0].person?.name}
                  />
                  <VoiceActorName>
                    {char.voice_actors[0].person?.name}
                  </VoiceActorName>
                  <VoiceActorLanguage>
                    {char.voice_actors[0].language}
                  </VoiceActorLanguage>
                </VoiceActor>
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
        {staff.map((member, index) => (
          <StaffCard key={index}>
            <StaffImage
              src={member.person?.images?.jpg?.image_url}
              alt={member.person?.name}
            />
            <StaffInfo>
              <StaffName>{member.person?.name}</StaffName>
              <StaffPositions>{member.positions?.join(", ")}</StaffPositions>
            </StaffInfo>
          </StaffCard>
        ))}
      </StaffGrid>
    ) : (
      <EmptyState>No staff information available</EmptyState>
    )}
  </StaffContent>
);

const RelatedTab = ({ relations }) => (
  <RelatedContent>
    <SectionTitle>Related Series</SectionTitle>
    {relations.length > 0 ? (
      relations.map((relation, index) => (
        <RelationGroup key={index}>
          <RelationType>{relation.relation}</RelationType>
          <RelationList>
            {relation.entry?.map((entry) => (
              <RelationCard key={entry.mal_id} to={`/anime/${entry.mal_id}`}>
                <RelationName>{entry.name}</RelationName>
                <RelationMeta>{entry.type}</RelationMeta>
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

// Styled Components
const LoadingContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const AnimeItemStyled = styled.div`
  position: relative;
  min-height: 100vh;
  background: #1a1a1a;
  padding-bottom: 4rem;
`;

const BackgroundImage = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(20px);
  opacity: 0.15;
  z-index: 0;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(26, 26, 26, 0.95),
    rgba(26, 26, 26, 0.98)
  );
  z-index: 1;
`;

const BackButton = styled.button`
  position: fixed;
  top: 6rem;
  left: 2rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(26, 26, 26, 0.9);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.7rem 1.2rem;
  border-radius: 25px;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
    transform: translateX(-5px);
  }
`;

const HeroSection = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: 6rem auto 2rem;
  padding: 2rem 3%;
  display: flex;
  gap: 3rem;

  @media (max-width: 968px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const PosterImage = styled.div`
  flex-shrink: 0;
  width: 300px;
  height: 450px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  border: 3px solid rgba(255, 215, 0, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 968px) {
    width: 250px;
    height: 375px;
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
  font-family: "Staatliches", "Shakuro", cursive;
  font-size: 3.5rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
  line-height: 1.1;

  @media (max-width: 968px) {
    font-size: 2.5rem;
  }
`;

const JapaneseTitle = styled.h2`
  font-family: "Noto Sans JP", sans-serif;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
  margin: 0;
`;

const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 968px) {
    justify-content: center;
  }
`;

const MetaBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  color: white;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  font-size: 0.9rem;

  &.score {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.4);
    color: #ffd700;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 968px) {
    justify-content: center;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
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
    background: rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    color: #ffd700;
    transform: translateY(-2px);
  }

  span {
    @media (max-width: 640px) {
      display: none;
    }
  }
`;

const TabNavigation = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: 0 auto 2rem;
  padding: 0 3%;
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
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
  background: ${(props) =>
    props.active ? "rgba(255, 215, 0, 0.2)" : "transparent"};
  border: none;
  border-bottom: 3px solid
    ${(props) => (props.active ? "#ffd700" : "transparent")};
  color: ${(props) => (props.active ? "#ffd700" : "rgba(255, 255, 255, 0.6)")};
  padding: 1rem 2rem;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
  }
`;

const ContentSection = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 3%;
`;

const OverviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SynopsisSection = styled.div``;

const SectionTitle = styled.h3`
  font-family: "Staatliches", cursive;
  font-size: 2rem;
  color: #ffd700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Synopsis = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 1.1rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #ffd700;
`;

const ReadMoreButton = styled.button`
  background: none;
  border: none;
  color: #ffd700;
  font-weight: 600;
  cursor: pointer;
  margin-left: 0.5rem;
  text-decoration: underline;

  &:hover {
    color: #ffea00;
  }
`;

const GenresContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1.5rem;
`;

const GenreBadge = styled.span`
  background: rgba(255, 215, 0, 0.15);
  border: 2px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.25);
    border-color: #ffd700;
    transform: translateY(-2px);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.2rem;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 215, 0, 0.3);
  }
`;

const InfoLabel = styled.div`
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  letter-spacing: 0.05em;
`;

const InfoValue = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 1rem;
  color: white;
  font-weight: 500;
`;

const TrailerSection = styled.div``;

const TrailerFrame = styled.iframe`
  width: 100%;
  max-width: 900px;
  height: 500px;
  border-radius: 16px;
  border: 3px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
`;

const EpisodesContent = styled.div``;

const EpisodeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 1rem;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 4px;
  }
`;

const EpisodeCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 215, 0, 0.3);
    transform: translateX(5px);
  }
`;

const EpisodeNumber = styled.div`
  background: linear-gradient(135deg, #ffd700 0%, #ffea00 100%);
  color: #1a1a1a;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
`;

const EpisodeInfo = styled.div`
  flex: 1;
`;

const EpisodeTitle = styled.div`
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  color: white;
  margin-bottom: 0.3rem;
`;

const EpisodeDate = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
`;

const CharactersContent = styled.div``;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const CharacterCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 215, 0, 0.3);
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.2);
  }
`;

const CharacterImage = styled.img`
  width: 100%;
  height: 320px;
  object-fit: cover;
`;

const CharacterInfo = styled.div`
  padding: 1rem;
`;

const CharacterName = styled.div`
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  color: white;
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
`;

const CharacterRole = styled.div`
  font-family: "Inter", sans-serif;
  color: #27ae60;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const VoiceActor = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const VoiceActorImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 215, 0, 0.3);
`;

const VoiceActorName = styled.div`
  flex: 1;
  font-family: "Montserrat", sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const VoiceActorLanguage = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
`;

const StaffContent = styled.div``;

const StaffGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
`;

const StaffCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.2rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 215, 0, 0.3);
  }
`;

const StaffImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 215, 0, 0.3);
`;

const StaffInfo = styled.div`
  flex: 1;
`;

const StaffName = styled.div`
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  color: white;
  margin-bottom: 0.3rem;
`;

const StaffPositions = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
`;

const RelatedContent = styled.div``;

const RelationGroup = styled.div`
  margin-bottom: 2rem;
`;

const RelationType = styled.h4`
  font-family: "Montserrat", sans-serif;
  font-size: 1.3rem;
  color: #ffd700;
  margin-bottom: 1rem;
  text-transform: capitalize;
`;

const RelationList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const RelationCard = styled(Link)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.2rem;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 215, 0, 0.3);
    transform: translateX(5px);
  }
`;

const RelationName = styled.div`
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
`;

const RelationMeta = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: "Inter", sans-serif;
  font-size: 1.1rem;
`;

const CommentsTab = ({
  comments,
  commentsLoading,
  newComment,
  setNewComment,
  handlePostComment,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <CommentsContainer>
      <SectionTitle>Discussion</SectionTitle>

      <CommentForm onSubmit={handlePostComment}>
        {currentUser ? (
          <>
            <CommentInputWrapper>
              <CommentAvatar>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" />
                ) : (
                  <User size={20} />
                )}
              </CommentAvatar>
              <CommentInput
                placeholder="What are your thoughts on this show? Share here..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              />
            </CommentInputWrapper>
            <CommentSubmitButton type="submit">
              Post Comment
            </CommentSubmitButton>
          </>
        ) : (
          <SignInPrompt onClick={onOpenAuth}>
            <span>Please sign in to join the discussion</span>
          </SignInPrompt>
        )}
      </CommentForm>

      {commentsLoading ? (
        <LoadingText>Loading comments...</LoadingText>
      ) : comments.length > 0 ? (
        <CommentsList>
          {comments.map((comment) => (
            <CommentCard key={comment.id}>
              <CommentAvatar>
                {comment.userAvatar ? (
                  <img src={comment.userAvatar} alt={comment.userName} />
                ) : (
                  <User size={20} />
                )}
              </CommentAvatar>
              <CommentBody>
                <CommentHeader>
                  <span className="username">{comment.userName}</span>
                  <span className="timestamp">
                    {comment.createdAt?.seconds
                      ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString()
                      : "Just now"}
                  </span>
                </CommentHeader>
                <CommentText>{comment.text}</CommentText>
              </CommentBody>
            </CommentCard>
          ))}
        </CommentsList>
      ) : (
        <NoComments>
          No discussions yet. Be the first to start the conversation!
        </NoComments>
      )}
    </CommentsContainer>
  );
};

const CommentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
`;

const CommentForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
`;

const CommentInputWrapper = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  align-items: flex-start;
`;

const CommentAvatar = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  background: #333;
  border: 2px solid rgba(255, 215, 0, 0.3);
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
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  padding: 0.8rem;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 80px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.15);
  }
`;

const CommentSubmitButton = styled.button`
  background: linear-gradient(135deg, #ffd700 0%, #ffea00 100%);
  color: #1a1a1a;
  border: none;
  padding: 0.6rem 1.5rem;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(255, 215, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(255, 215, 0, 0.4);
  }
`;

const SignInPrompt = styled.div`
  width: 100%;
  padding: 1.5rem;
  text-align: center;
  background: rgba(255, 215, 0, 0.05);
  border: 2px dashed rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.1);
    border-color: #ffd700;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
  }
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const CommentCard = styled.div`
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.2rem;
  border-radius: 12px;
  width: 100%;
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
    font-weight: 600;
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
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  margin: 0;
`;

const NoComments = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.4);
  font-family: "Inter", sans-serif;
  font-size: 1rem;
`;

const LoadingText = styled.div`
  text-align: center;
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  padding: 2rem;
`;

const StreamingSection = styled.div`
  margin-top: 2rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
`;

const StreamingGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
`;

const StreamingButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background: #ffd700;
    color: #1a1a1a;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    transform: translateY(-2px);
  }
`;

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
}) => {
  return (
    <ReviewsContainer>
      <SectionTitle>User Reviews</SectionTitle>

      <ReviewForm onSubmit={handlePostReview}>
        {currentUser ? (
          <>
            <div className="review-setup">
              <span className="label">Your Rating:</span>
              <select
                value={newReviewRating}
                onChange={(e) => setNewReviewRating(Number(e.target.value))}
              >
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                  <option key={num} value={num}>
                    {num}/10 Stars
                  </option>
                ))}
              </select>
            </div>
            <ReviewTextarea
              placeholder="Write your detailed review here. What did you like? What did you dislike?"
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              required
            />
            <CommentSubmitButton type="submit">
              Submit Review
            </CommentSubmitButton>
          </>
        ) : (
          <SignInPrompt onClick={onOpenAuth}>
            <span>Please sign in to write a review</span>
          </SignInPrompt>
        )}
      </ReviewForm>

      {reviewsLoading ? (
        <LoadingText>Loading reviews...</LoadingText>
      ) : reviews.length > 0 ? (
        <ReviewsList>
          {reviews.map((review) => (
            <ReviewCard key={review.id}>
              <ReviewHeader>
                <ReviewUser>
                  <CommentAvatar>
                    {review.userAvatar ? (
                      <img src={review.userAvatar} alt={review.userName} />
                    ) : (
                      <User size={20} />
                    )}
                  </CommentAvatar>
                  <div className="user-details">
                    <span className="name">{review.userName}</span>
                    <span className="date">
                      {review.createdAt?.seconds
                        ? new Date(review.createdAt.seconds * 1000).toLocaleDateString()
                        : "Just now"}
                    </span>
                  </div>
                </ReviewUser>
                <ReviewScoreBadge>
                  <Star size={16} fill="#ffd700" color="#ffd700" />
                  <span>{review.rating}/10</span>
                </ReviewScoreBadge>
              </ReviewHeader>
              <ReviewContentText>{review.text}</ReviewContentText>
            </ReviewCard>
          ))}
        </ReviewsList>
      ) : (
        <NoReviews>
          No reviews available yet. Share your experience!
        </NoReviews>
      )}
    </ReviewsContainer>
  );
};

const StatusDropdownMenu = styled.div`
  position: absolute;
  top: 110%;
  left: 0;
  background: #2a2a2a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  width: 180px;
  z-index: 100;
  overflow: hidden;
`;

const StatusDropdownItem = styled.button`
  width: 100%;
  padding: 0.7rem 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-family: "Montserrat", sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.1);
    color: #ffd700;
  }

  &.selected {
    background: #ffd700;
    color: #1a1a1a;
    font-weight: 700;
  }

  &.remove {
    color: #ff4d4d;

    &:hover {
      background: rgba(255, 77, 77, 0.1);
      color: #ff6b6b;
    }
  }
`;

const ReviewsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
`;

const ReviewForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;

  .review-setup {
    display: flex;
    align-items: center;
    gap: 1rem;

    .label {
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      color: #ffd700;
    }

    select {
      background: #2a2a2a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-family: "Montserrat", sans-serif;
      outline: none;
      cursor: pointer;

      &:focus {
        border-color: #ffd700;
      }
    }
  }
`;

const ReviewTextarea = styled.textarea`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  padding: 0.8rem;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.15);
  }
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const ReviewCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 12px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ReviewUser = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  .user-details {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    .name {
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      color: white;
    }

    .date {
      font-family: "Inter", sans-serif;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.4);
    }
  }
`;

const ReviewScoreBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
`;

const ReviewContentText = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
`;

const NoReviews = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.4);
  font-family: "Inter", sans-serif;
  font-size: 1rem;
`;

export default AnimeItemEnhanced;