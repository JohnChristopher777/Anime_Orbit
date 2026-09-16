import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { Binoculars, BookOpen, Bookmark, Layers3, ArrowRight, Heart, User, MessageCircle, MessageSquare, Info } from "lucide-react";
import { useGlobalContext } from "../context/global";
import HeroCarousel from "./HeroCarousel";
import SEO from "./SEO";
import AnimeRow from "./AnimeRow";
import ProgressiveImage from "./ProgressiveImage";

import Footer from "./Footer";

const Popular = lazy(() => import("./Popular"));

const FEATURE_LINKS = [
  { to: "/discovery", icon: Binoculars, eyebrow: "Anime Finder", title: "Remember the scene, not the title?", copy: "Upload a screenshot, describe a scene, search a quote, or get picks based on what you already like.", details: ["Screenshot match", "Scene clues", "Quote finder"], action: "Find an anime", artworkIndex: 1, layout: "spotlight" },
  { to: "/watchlist", icon: Bookmark, eyebrow: "Your Watchlist", title: "Keep every show and manga in one place", copy: "Set watching or reading status, add start and finish dates, and save private notes for every title.", details: ["Watch status", "Start and finish dates", "Private notes"], action: "Open watchlist", artworkIndex: 3, layout: "reverse" },
  { to: "/manga", icon: BookOpen, eyebrow: "Manga Library", title: "Find your next read", copy: "Browse manga, open full series pages, and track what you plan to read, are reading, or have finished.", details: ["Full manga search", "Reading status", "Chapter details"], action: "Browse manga", artworkIndex: 5, layout: "banner" },
  { to: "/genres", icon: Layers3, eyebrow: "Browse Genres", title: "Jump straight into your mood", copy: "Explore action, romance, fantasy, slice of life, mystery, and other familiar anime genres.", details: ["17 genre shelves", "Fan favorites", "Quick sorting"], action: "Choose a genre", artworkIndex: 7, layout: "split" },
  { to: "/favourites", icon: Heart, eyebrow: "Favorites", title: "Save the anime you would recommend", copy: "Keep your all-time favorites together and turn them into a personal tier list whenever you want.", details: ["Favorite shelf", "Personal tier list", "Easy sharing"], action: "See favorites", artworkIndex: 2, layout: "reverse" },
  { to: "/profile", icon: User, eyebrow: "Your Profile", title: "See your anime life at a glance", copy: "Your tracked titles, favorites, reviews, and activity come together in one personal space.", details: ["Watch stats", "Top genres", "Recent activity"], action: "View profile", artworkIndex: 4, layout: "banner" },
  { to: "/my-reviews", icon: MessageCircle, eyebrow: "Your Reviews", title: "Rate a series and share your take", copy: "Return to every review you posted, update your opinion, and help other fans decide what to watch.", details: ["Your ratings", "Written reviews", "Quick return"], action: "Read your reviews", artworkIndex: 6, layout: "split" },
  { to: "/my-comments", icon: MessageSquare, eyebrow: "Discussions", title: "Pick up the conversation", copy: "Find the anime discussions you joined and keep talking with other fans without losing the thread.", details: ["Joined threads", "Spoiler controls", "Community replies"], action: "Open discussions", artworkIndex: 8, layout: "reverse" },
  { to: "/about", icon: Info, eyebrow: "About Anime Orbit", title: "Built for finding, tracking, and talking anime", copy: "See how the app brings anime details, manga, discovery, lists, and community features together.", details: ["What is included", "How discovery works", "Privacy basics"], action: "About the project", artworkIndex: 0, layout: "banner" },
];

export function Homepage() {
  const {
    search,
    popularAnime,
    searchResults,
    loading,
    topAiringAnime,
    upcomingAnime,
    airingAnime,
    getPopularAnime,
    getAiringAnime,
    getTopAiringAnime,
    getUpcomingAnime,
  } = useGlobalContext();
  const [homeLoading, setHomeLoading] = React.useState(true);
  const requestedHomeData = React.useRef(false);

  React.useEffect(() => {
    if (requestedHomeData.current) return;
    requestedHomeData.current = true;

    const requests: Promise<void>[] = [];
    if (!popularAnime.length) requests.push(getPopularAnime(1));
    if (!airingAnime.length) requests.push(getAiringAnime(1));
    if (!topAiringAnime.length) requests.push(getTopAiringAnime());
    if (!upcomingAnime.length) requests.push(getUpcomingAnime(1));

    Promise.allSettled(requests).finally(() => setHomeLoading(false));
  }, [popularAnime.length, airingAnime.length, topAiringAnime.length, upcomingAnime.length, getPopularAnime, getAiringAnime, getTopAiringAnime, getUpcomingAnime]);

  const switchComponent = () => {
    const safeSearchResults = Array.isArray(searchResults) ? searchResults : [];
    const safePopularAnime = Array.isArray(popularAnime) ? popularAnime : [];

    if (search) {
      if (loading) {
        return (
          <AnimeRow
            title="Search results"
            items={[]}
            to="/"
            loading
          />
        );
      }
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

    return (
      <div className="home-catalog">
        <AnimeRow title="Most Popular" items={safePopularAnime} to="/popular" loading={homeLoading} />
        <AnimeRow title="New Episodes" items={Array.isArray(airingAnime) ? airingAnime : []} to="/airing" loading={homeLoading} />
        <AnimeRow title="Coming Soon" items={Array.isArray(upcomingAnime) ? upcomingAnime : []} to="/upcoming" loading={homeLoading} />
        <div className="home-feature-stories" aria-labelledby="feature-guide-title">
          <div className="home-feature-stories__intro">
            <span>Everything in one orbit</span>
            <h2 id="feature-guide-title">More than an anime chart</h2>
            <p>Each part of Anime Orbit has its own home, so you can discover, track, read, and join the conversation without digging through menus.</p>
          </div>
          {FEATURE_LINKS.map(({ to, icon: Icon, eyebrow, title, copy, details, action, artworkIndex, layout }) => {
              const artworkAnime = [...topAiringAnime, ...safePopularAnime][artworkIndex];
              const artwork = artworkAnime?.banner_image || artworkAnime?.images?.jpg?.large_image_url;
              return (
                <section key={to} data-feature={to.slice(1)} className={`home-feature-story home-feature-story--${layout}`}>
                  <div className="home-feature-story__art" aria-hidden="true">
                    {artwork ? <ProgressiveImage src={artwork} alt="" wrapperClassName="absolute inset-0" className="h-full w-full object-cover" /> : <Icon size={72} />}
                  </div>
                  <div className="home-feature-story__copy">
                    <span className="home-feature-story__eyebrow"><Icon size={16} /> {eyebrow}</span>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                    <div className="home-feature-story__details" aria-label={`${eyebrow} features`}>
                      {details.map((detail) => <span key={detail}><span aria-hidden="true" />{detail}</span>)}
                    </div>
                    <Link to={to}>{action}<ArrowRight size={17} /></Link>
                  </div>
                </section>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col relative">
      <SEO
        title="Anime Orbit - Your Cosmic Anime Compass & Universal Guide"
        description="Lost in the vast anime universe? Anime Orbit is your cosmic compass guiding you through all genres: Action, Fantasy, Romance, Sci-Fi, and timeless masterpieces like One Piece, Bleach, Naruto, and Vinland Saga."
        keywords="Anime Orbit, anime database, anime compass, all genres anime, One Piece, Bleach, Naruto, Vinland Saga, Attack on Titan, Jujutsu Kaisen"
        url="https://animeorbit.web.app/"
      />
      {!search && <HeroCarousel trendingAnime={topAiringAnime} />}

      <main className={`flex-1 ${search ? "mt-24 px-4" : ""}`}>
        <Suspense
          fallback={<div className="page-skeleton" aria-label="Loading page"><span /><span /><span /></div>}
        >
          {switchComponent()}
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

export default Homepage;
