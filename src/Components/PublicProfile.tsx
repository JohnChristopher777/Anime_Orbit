import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Disc3,
  Film,
  Heart,
  Layers3,
  List,
  PlayCircle,
  Radio,
  Sparkles,
  Star,
  Tag,
  Tv,
  User,
} from "lucide-react";
import { db } from "../firebase/config";
import { safeImageUrl, sanitizeInput } from "../utils/security";
import SEO from "./SEO";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";

interface PublicMedia {
  id: number;
  mediaType: "ANIME" | "MANGA";
  title: string;
  image: string;
  format: string;
  duration: number;
  status: string;
  progress: number;
  total: number;
  score: number;
  userScore: number;
  genres: string[];
}

interface PublicUserData {
  displayName: string;
  userId?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  favoriteGenre?: string;
  createdAt?: string;
  favourites: PublicMedia[];
  watchlist: PublicMedia[];
  stats: {
    favourites: number;
    library: number;
    completed: number;
    watching: number;
    caughtUp: number;
    planned: number;
    averageScore: number;
  };
}

const safeMedia = (value: unknown): PublicMedia[] =>
  (Array.isArray(value) ? value : [])
    .map((item: any) => ({
      id: Math.max(0, Number(item?.id) || 0),
      mediaType:
        item?.mediaType === "MANGA" ? ("MANGA" as const) : ("ANIME" as const),
      title: sanitizeInput(item?.title || "Untitled", 120),
      image: safeImageUrl(item?.image),
      format: sanitizeInput(item?.format || item?.mediaType || "Anime", 30),
      duration: Math.max(0, Math.min(1440, Number(item?.duration) || 0)),
      status: sanitizeInput(item?.status || "Plan to Watch", 30),
      progress: Math.max(0, Number(item?.progress) || 0),
      total: Math.max(0, Number(item?.total) || 0),
      score: Math.max(0, Math.min(10, Number(item?.score) || 0)),
      userScore: Math.max(0, Math.min(10, Number(item?.userScore) || 0)),
      genres: (Array.isArray(item?.genres) ? item.genres : [])
        .map((genre: unknown) => sanitizeInput(String(genre || ""), 30))
        .filter(Boolean)
        .slice(0, 8),
    }))
    .filter((item) => item.id > 0 && item.title)
    .slice(0, 100);

const shapeProfile = (data: any): PublicUserData => {
  const favourites = safeMedia(data?.favourites);
  const watchlist = safeMedia(data?.watchlist);
  const stats = data?.stats && typeof data.stats === "object" ? data.stats : {};
  return {
    displayName: sanitizeInput(data?.displayName || "Anime Fan", 30),
    userId: sanitizeInput(data?.userId, 24),
    avatarUrl: safeImageUrl(data?.avatarUrl || data?.photoURL || data?.avatar || data?.userAvatar),
    bannerUrl: safeImageUrl(data?.bannerUrl || data?.banner),
    bio: sanitizeInput(data?.bio, 500),
    favoriteGenre: sanitizeInput(data?.favoriteGenre || "Anime", 40),
    createdAt: typeof data?.createdAt === "string" ? data.createdAt : data?.createdAt?.toDate?.()?.toISOString?.() || "",
    favourites,
    watchlist,
    stats: {
      favourites: Number(stats.favourites) || favourites.length,
      library: Number(stats.library) || watchlist.length,
      completed: Number(stats.completed) || 0,
      watching: Number(stats.watching) || 0,
      caughtUp:
        Number(stats.caughtUp) ||
        watchlist.filter((item) => item.status.toLowerCase().replace(/[^a-z]/g, "") === "caughtup").length,
      planned: Number(stats.planned) || 0,
      averageScore: Number(stats.averageScore) || 0,
    },
  };
};

const dateLabel = (value?: string) => {
  if (!value) return "Recently joined";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently joined"
    : `Joined ${date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
};

const statusTone = (status: string) => {
  const key = status.toLowerCase();
  if (key.includes("complete") || key === "read") return "is-complete";
  if (key.includes("watch") || key.includes("read") || key.includes("caught")) return "is-active";
  if (key.includes("drop")) return "is-dropped";
  if (key.includes("pause") || key.includes("hold")) return "is-paused";
  return "is-planned";
};

const MediaCard: React.FC<{ item: PublicMedia; favourite?: boolean }> = ({
  item,
  favourite,
}) => {
  const route =
    item.mediaType === "MANGA" ? `/manga/${item.id}` : `/anime/${item.id}`;
  const unit = item.mediaType === "MANGA" ? "chapters" : "episodes";
  const percent = item.total
    ? Math.min(100, (item.progress / item.total) * 100)
    : 0;
  return (
    <Link to={route} className="public-library-card">
      <ProgressiveImage
        src={item.image}
        fallbackSrc="/lost.jpg"
        alt=""
        wrapperClassName="public-library-card__cover"
        className="h-full w-full object-cover"
      />
      <div className="public-library-card__body">
        <div>
          <span>{item.format || item.mediaType}</span>
          {item.userScore > 0 && (
            <b>
              <Star size={12} fill="currentColor" /> {item.userScore}
            </b>
          )}
        </div>
        <h3>{item.title}</h3>
        {favourite ? (
          <p className="public-library-card__favourite">
            <Heart size={13} fill="currentColor" /> Favourite title
          </p>
        ) : (
          <>
            <p
              className={`public-library-card__status ${statusTone(item.status)}`}
            >
              {item.status}
            </p>
            <div className="public-library-card__progress">
              <i>
                <b style={{ width: `${percent}%` }} />
              </i>
              <small>
                {item.progress}
                {item.total ? ` / ${item.total}` : ""} {unit}
              </small>
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = React.useState<PublicUserData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let active = true;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const direct = await getDoc(doc(db, "publicProfiles", id));
        let profileUid = direct.exists() ? direct.id : "";
        let profileData: any = direct.exists() ? direct.data() : null;
        if (!profileData) {
          const result = await getDocs(
            query(collection(db, "publicProfiles"), where("userId", "==", id)),
          );
          if (!result.empty) {
            profileUid = result.docs[0].id;
            profileData = result.docs[0].data();
          }
        }
        let shaped = profileData ? shapeProfile(profileData) : null;

        // Legacy public profiles did not always contain an avatar. Discussion
        // identity is already public, so use its latest safe image/name while
        // the profile owner has not yet refreshed their projection.
        if (!shaped?.avatarUrl || !shaped?.displayName || shaped.displayName === "Anime Fan") {
          const lookups = profileUid
            ? [query(collection(db, "comments"), where("userId", "==", profileUid), limit(20))]
            : [
                query(collection(db, "comments"), where("profileHandle", "==", id), limit(20)),
                query(collection(db, "comments"), where("userId", "==", id), limit(20)),
              ];
          for (const lookup of lookups) {
            const identitySnapshot = await getDocs(lookup);
            const identity = identitySnapshot.docs
              .map((entry) => entry.data())
              .find((entry: any) => entry.userAvatar || entry.userName);
            if (!identity) continue;
            shaped = {
              ...(shaped || shapeProfile({})),
              displayName: shaped?.displayName && shaped.displayName !== "Anime Fan"
                ? shaped.displayName
                : sanitizeInput(identity.userName || "Anime Fan", 30),
              avatarUrl: shaped?.avatarUrl || safeImageUrl(identity.userAvatar),
              userId: shaped?.userId || sanitizeInput(identity.profileHandle || "", 24),
            };
            break;
          }
        }
        if (active) setUserData(shaped);
      } catch {
        if (active) setUserData(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchUser();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading)
    return (
      <main className="public-profile-page">
        <div className="public-profile-loading">
          <i />
          <span />
          <span />
          <div />
        </div>
      </main>
    );

  if (!userData)
    return (
      <div className="public-profile-page">
        <main className="public-profile-empty">
          <User size={54} />
          <h1>Profile unavailable</h1>
          <p>This member has not published a profile yet.</p>
          <button type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Back to discussion
          </button>
        </main>
        <Footer />
      </div>
    );

  const tasteLibrary = [
    ...new Map(
      [...userData.watchlist, ...userData.favourites].map((item) => [
        `${item.mediaType}-${item.id}`,
        item,
      ]),
    ).values(),
  ];
  const animeTasteCount = tasteLibrary.filter(
    (item) => item.mediaType === "ANIME",
  ).length;
  const mangaTasteCount = tasteLibrary.filter(
    (item) => item.mediaType === "MANGA",
  ).length;
  const tasteTotal = tasteLibrary.length;
  const animeTasteRatio = tasteTotal
    ? Math.round((animeTasteCount / tasteTotal) * 100)
    : 0;
  const mangaTasteRatio = tasteTotal ? 100 - animeTasteRatio : 0;
  const genreCounts = new Map<string, number>();
  tasteLibrary.forEach((item) =>
    item.genres.forEach((genre) =>
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1),
    ),
  );
  const genres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const tasteSummary = !tasteTotal
    ? `${userData.displayName}'s anime and manga balance will appear as their public library grows.`
    : animeTasteRatio >= 65
      ? `${userData.displayName}'s library leans toward anime ${animeTasteRatio}%,${genres[0] ? ` led by ${genres.slice(0, 3).map(([genre]) => genre).join(", ")}` : " with a growing range of genres"}.`
      : mangaTasteRatio >= 65
        ? `${userData.displayName}'s library leans toward manga ${mangaTasteRatio}%,${genres[0] ? ` led by ${genres.slice(0, 3).map(([genre]) => genre).join(", ")}` : " with a growing range of genres"}.`
        : `${userData.displayName} keeps a balanced anime and manga library ${animeTasteRatio}% anime and ${mangaTasteRatio}% manga ${genres[0] ? `, with the strongest interest in ${genres.slice(0, 3).map(([genre]) => genre).join(", ")}` : ""}.`;

  const animeLibrary = userData.watchlist.filter((item) => item.mediaType === "ANIME");
  const normalizeStatus = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");
  const animeWatching = animeLibrary.filter((item) => normalizeStatus(item.status) === "watching").length;
  const animeCaughtUp = animeLibrary.filter((item) => normalizeStatus(item.status) === "caughtup").length;
  const animeCompleted = animeLibrary.filter((item) => ["completed", "watched"].includes(normalizeStatus(item.status))).length;
  const animeFavourites = userData.favourites.filter((item) => item.mediaType === "ANIME").length;
  const viewingBreakdown = animeLibrary.reduce(
    (totals, item) => {
      const format = String(item.format || "TV").trim().toUpperCase().replace(/[\s-]+/g, "_");
      const completed = ["completed", "watched"].includes(normalizeStatus(item.status));
      const watchedUnits = Math.floor(completed ? Math.max(item.progress, item.total || 1) : item.progress);
      if (!watchedUnits) return totals;

      if (format === "MOVIE") totals.movies += watchedUnits;
      else if (format === "OVA") totals.ova += watchedUnits;
      else if (format === "ONA") totals.ona += watchedUnits;
      else if (format === "SPECIAL") totals.specials += watchedUnits;
      else if (format === "TV" || format === "TV_SHORT") totals.tvEpisodes += watchedUnits;
      else totals.other += watchedUnits;

      const fallbackDuration = format === "MOVIE" ? 100 : format === "MUSIC" ? 4 : 24;
      totals.minutes += watchedUnits * (item.duration || fallbackDuration);
      return totals;
    },
    { tvEpisodes: 0, movies: 0, ova: 0, ona: 0, specials: 0, other: 0, minutes: 0 },
  );
  const watchHours = (viewingBreakdown.minutes / 60).toFixed(2);
  const scrollToPublicLibrary = (sectionId: "public-watchlist" | "public-favourites") => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="public-profile-page">
      <SEO
        title={`${userData.displayName} - Anime Orbit Profile`}
        description={`View ${userData.displayName}'s public anime favourites, watchlist and viewing progress.`}
        keywords="anime user profile, public anime watchlist, anime favourites"
        url={`https://animeorbit.web.app/user/${id}`}
        image={userData.avatarUrl || "https://animeorbit.web.app/animeorbit.jpg"}
        type="profile"
        pageType="ProfilePage"
        structuredData={{
          "@type": "Person",
          "@id": `https://animeorbit.web.app/user/${id}#person`,
          name: userData.displayName,
          description: userData.bio || tasteSummary,
          ...(userData.avatarUrl ? { image: userData.avatarUrl } : {}),
          url: `https://animeorbit.web.app/user/${id}`,
        }}
        breadcrumbs={[
          { name: "Anime Orbit", url: "https://animeorbit.web.app/" },
          { name: userData.displayName, url: `https://animeorbit.web.app/user/${id}` },
        ]}
      />
      <main className="public-profile-shell">
        <button
          type="button"
          className="public-profile-back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={17} /> Back to discussion
        </button>

        <section className="public-profile-hero">
          {userData.bannerUrl ? (
            <ProgressiveImage
              src={userData.bannerUrl}
              alt=""
              wrapperClassName="public-profile-hero__banner"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="public-profile-hero__banner public-profile-hero__banner--empty" />
          )}
          <div className="public-profile-hero__shade" />
          <div className="public-profile-hero__identity">
            <div className="public-profile-hero__avatar">
              {userData.avatarUrl ? (
                <ProgressiveImage
                  src={userData.avatarUrl}
                  fallbackSrc="/icon.png"
                  alt={userData.displayName}
                  loading="eager"
                  wrapperClassName="public-profile-hero__avatar-image"
                  className="public-profile-hero__avatar-img"
                />
              ) : (
                <span>{userData.displayName[0]?.toUpperCase() || "A"}</span>
              )}
            </div>
            <div className="public-profile-hero__copy">
              <span>Public anime profile</span>
              <h1>{userData.displayName}</h1>
              {userData.userId && <strong>@{userData.userId}</strong>}
              <p>
                {userData.bio ||
                  "Building a personal trail through anime and manga."}
              </p>
              <div>
                <b>
                  <Tag size={13} />
                  {userData.favoriteGenre}
                </b>
                <small>{dateLabel(userData.createdAt)}</small>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-insights public-profile-activity" aria-labelledby="public-profile-activity-title">
          <div className="profile-insights__header">
            <div><h2 id="public-profile-activity-title">Profile overview</h2></div>
            <div>
              <button type="button" onClick={() => scrollToPublicLibrary("public-watchlist")}>View watchlist</button>
              <button type="button" onClick={() => scrollToPublicLibrary("public-favourites")}>View favorites</button>
            </div>
          </div>
          <div className="profile-insights__stats">
            <div><List size={18} aria-hidden="true" /><strong>{animeLibrary.length}</strong><span>Tracked</span></div>
            <div><PlayCircle size={18} aria-hidden="true" /><strong>{animeWatching}</strong><span>Watching</span></div>
            <div><Radio size={18} aria-hidden="true" /><strong>{animeCaughtUp}</strong><span>Caught up</span></div>
            <div><CheckCircle2 size={18} aria-hidden="true" /><strong>{animeCompleted}</strong><span>Completed</span></div>
            <div><Heart size={18} aria-hidden="true" /><strong>{animeFavourites}</strong><span>Favorites</span></div>
          </div>
          <section className="profile-viewing-breakdown" aria-labelledby="public-viewing-breakdown-title">
            <header>
              <div><h3 id="public-viewing-breakdown-title">Complete Watch Activity</h3></div>
              <p>Calculated from this member's public watchlist progress.</p>
            </header>
            <div>
              <article><Tv aria-hidden="true" /><strong>{viewingBreakdown.tvEpisodes}</strong><span>TV episodes</span></article>
              <article><Film aria-hidden="true" /><strong>{viewingBreakdown.movies}</strong><span>Movies</span></article>
              <article><Disc3 aria-hidden="true" /><strong>{viewingBreakdown.ova}</strong><span>OVA episodes</span></article>
              <article><Radio aria-hidden="true" /><strong>{viewingBreakdown.ona}</strong><span>ONA episodes</span></article>
              <article><Sparkles aria-hidden="true" /><strong>{viewingBreakdown.specials}</strong><span>Specials</span></article>
              <article><Layers3 aria-hidden="true" /><strong>{viewingBreakdown.other}</strong><span>Other</span></article>
              <article className="is-hours"><Clock3 aria-hidden="true" /><strong>{watchHours}<small> hrs</small></strong><span>Actual watch time</span></article>
            </div>
          </section>
        </section>

        <section className="public-profile-taste public-profile-taste--primary" aria-labelledby="public-taste-title">
          <header>
            <div>
              <span>Taste profile</span>
              <h2 id="public-taste-title">Anime & manga taste balance</h2>
            </div>
            <b>{tasteTotal} unique titles</b>
          </header>
          <div className="public-profile-taste__layout">
            <div className="public-profile-taste__ratio" aria-label={`${animeTasteRatio}% anime and ${mangaTasteRatio}% manga`}>
              <div>
                <span style={{ width: `${animeTasteRatio}%` }} />
                <span style={{ width: `${mangaTasteRatio}%` }} />
              </div>
              <section>
                <div><Tv size={18} /><span>Anime</span><strong>{animeTasteRatio}%</strong><small>{animeTasteCount} titles</small></div>
                <div><BookOpen size={18} /><span>Manga</span><strong>{mangaTasteRatio}%</strong><small>{mangaTasteCount} titles</small></div>
              </section>
            </div>
            <div className="public-profile-taste__summary">
              <span>Taste readout</span>
              <p>{tasteSummary}</p>
              {genres.length > 0 && (
                <div>{genres.slice(0, 4).map(([genre, count]) => <b key={genre}>{genre}<small>{Math.round((count / tasteTotal) * 100)}%</small></b>)}</div>
              )}
            </div>
          </div>
        </section>

        <section className="public-profile-library" id="public-favourites">
          <header>
            <div>
              <span>
                <Heart size={14} /> Personal highlights
              </span>
              <h2>Favourite anime & manga</h2>
            </div>
            <b>{userData.favourites.length}</b>
          </header>
          {userData.favourites.length ? (
            <div className="public-profile-grid">
              {userData.favourites.map((item) => (
                <MediaCard
                  key={`${item.mediaType}-${item.id}`}
                  item={item}
                  favourite
                />
              ))}
            </div>
          ) : (
            <p className="public-profile-library__empty">
              No public favourites yet.
            </p>
          )}
        </section>
        <section className="public-profile-library" id="public-watchlist">
          <header>
            <div>
              <span>
                <BookOpen size={14} /> Current library
              </span>
              <h2>Watchlist & reading progress</h2>
            </div>
            <b>{userData.watchlist.length}</b>
          </header>
          {userData.watchlist.length ? (
            <div className="public-profile-grid">
              {userData.watchlist.map((item) => (
                <MediaCard key={`${item.mediaType}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <p className="public-profile-library__empty">
              No public library entries yet.
            </p>
          )}
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default PublicProfile;
