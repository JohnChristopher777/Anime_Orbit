import React, { Component, type ReactNode, type ErrorInfo, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import Nav from "./Components/Nav";
import ScrollButton from "./Components/ScrollButton";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGlobalContext } from "./context/global";
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import PWAStatus from "./Components/PWAStatus";
import PublicProfileSync from "./Components/PublicProfileSync";

// Route-level code splitting keeps the first mobile load small.
const Homepage = lazy(() => import("./Components/Homepage"));
const Galaxy = lazy(() => import("./Components/Galaxy"));
const Popular = lazy(() => import("./Components/Popular"));
const AnimeItem = lazy(() => import("./Components/AnimeItem"));
const Gallery = lazy(() => import("./Components/Gallery"));
const Favourites = lazy(() => import("./Components/Favourites"));
const AboutUs = lazy(() => import("./Components/AboutUs"));
const Watchlist = lazy(() => import("./Components/Watchlist"));
const SharedWatchlist = lazy(() => import("./Components/SharedWatchlist"));
const SharedFavourites = lazy(() => import("./Components/SharedFavourites"));
const MyReviews = lazy(() => import("./Components/MyReviews"));
const MyComments = lazy(() => import("./Components/MyComments"));
const Profile = lazy(() => import("./Components/Profile"));
const PublicProfile = lazy(() => import("./Components/PublicProfile"));
const Trending = lazy(() => import("./Components/Trending"));
const Upcoming = lazy(() => import("./Components/Upcoming"));
const Genres = lazy(() => import("./Components/Genres"));
const Manga = lazy(() => import("./Components/Manga"));
const MangaItem = lazy(() => import("./Components/MangaItem"));
const NeuralDiscovery = lazy(() => import("./Components/NeuralDiscovery"));
const CharacterFinder = lazy(() => import("./Components/CharacterFinder"));
const VoiceActorDetails = lazy(() => import("./Components/VoiceActorDetails"));
const AnimeDigest = lazy(() => import("./Components/AnimeDigest"));
const FranchiseExplorer = lazy(() => import("./Components/FranchiseExplorer"));
const FranchiseDetails = lazy(() => import("./Components/FranchiseDetails"));
const NotFound = lazy(() => import("./Components/NotFound"));

// Global Error Boundary to prevent black screen crashes
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Gracefully handled
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center text-white bg-[#141414]">
          <AlertTriangle size={56} className="text-[#ffd700] mb-4" />
          <h2 className="text-2xl font-bold font-montserrat text-[#ffd700] mb-2">
            Something went wrong
          </h2>
          <p className="text-neutral-400 max-w-md mb-6 text-sm">
            We encountered an unexpected error while loading this view. Please try reloading or return home.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="flex items-center gap-2 bg-[#ffd700] text-black px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform"
            >
              <RefreshCw size={16} /> Reload Page
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors"
            >
              <Home size={16} /> Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { setSearch } = useGlobalContext();

  // Scroll restoration hook
  useScrollRestoration();

  React.useEffect(() => {
    // Clear global search state if navigating to any page other than homepage or details
    if (location.pathname !== "/" && !location.pathname.startsWith("/anime/")) {
      setSearch("");
    }
  }, [location.pathname, setSearch]);

  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#141414] text-white flex flex-col">
      {/* Ambient WebGL Galaxy Shader Background with Mobile Static Optimization */}
      {!isMobile && (
        <Suspense fallback={null}>
          <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
            <Galaxy
              mouseRepulsion={false}
              mouseInteraction={false}
              density={0.8}
              glowIntensity={0.3}
              saturation={0.55}
              hueShift={170}
              twinkleIntensity={0.5}
              rotationSpeed={0.035}
              repulsionStrength={0}
              autoCenterRepulsion={0}
              starSpeed={0.07}
              speed={0.15}
              transparent={true}
            />
          </div>
        </Suspense>
      )}

      <Nav />
      <div className={`relative z-10 flex-1 ${isHome ? "mt-0" : "mt-[64px] sm:mt-[70px]"}`}>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="page-skeleton" aria-label="Loading page">
                <span /><span /><span />
              </div>
            }
          >
            {children}
          </Suspense>
        </ErrorBoundary>
      </div>
      <ScrollButton />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <PublicProfileSync />
      <ToastContainer
        position="bottom-right"
        autoClose={2200}
        limit={2}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="!bg-[#12121a]/95 !border !border-[#ffd700]/40 !text-white !font-montserrat !text-xs !shadow-2xl !rounded-2xl !backdrop-blur-xl !px-4 !py-3"
        style={{ zIndex: 99999 }}
      />
      <Routes>
        <Route
          path="/about"
          element={
            <Layout>
              <AboutUs />
            </Layout>
          }
        />
        <Route
          path="/"
          element={
            <Layout>
              <Homepage />
            </Layout>
          }
        />
        <Route
          path="/genres"
          element={
            <Layout>
              <Genres />
            </Layout>
          }
        />
        <Route
          path="/popular"
          element={
            <Layout>
              <Popular />
            </Layout>
          }
        />
        <Route
          path="/manga"
          element={
            <Layout>
              <Manga />
            </Layout>
          }
        />
        <Route
          path="/anime/:id"
          element={
            <Layout>
              <AnimeItem />
            </Layout>
          }
        />
        <Route
          path="/manga/:id"
          element={
            <Layout>
              <MangaItem />
            </Layout>
          }
        />
        <Route
          path="/user/:id"
          element={
            <Layout>
              <PublicProfile />
            </Layout>
          }
        />
        <Route
          path="/favourites"
          element={
            <Layout>
              <Favourites />
            </Layout>
          }
        />
        <Route
          path="/shared-favourites"
          element={
            <Layout>
              <SharedFavourites />
            </Layout>
          }
        />
        <Route
          path="/watchlist"
          element={
            <Layout>
              <Watchlist />
            </Layout>
          }
        />
        <Route
          path="/shared-list"
          element={
            <Layout>
              <SharedWatchlist />
            </Layout>
          }
        />
        <Route
          path="/my-reviews"
          element={
            <Layout>
              <MyReviews />
            </Layout>
          }
        />
        <Route
          path="/my-comments"
          element={
            <Layout>
              <MyComments />
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />
        <Route
          path="/trending"
          element={
            <Layout>
              <Trending />
            </Layout>
          }
        />
        <Route
          path="/airing"
          element={
            <Layout>
              <Trending mode="airing" />
            </Layout>
          }
        />
        <Route
          path="/upcoming"
          element={
            <Layout>
              <Upcoming />
            </Layout>
          }
        />
        <Route
          path="/discovery"
          element={
            <Layout>
              <NeuralDiscovery />
            </Layout>
          }
        />
        <Route
          path="/discovery/characters"
          element={<Layout><CharacterFinder /></Layout>}
        />
        <Route
          path="/voice-actor/:id"
          element={<Layout><VoiceActorDetails /></Layout>}
        />
        <Route
          path="/digest"
          element={
            <Layout>
              <AnimeDigest />
            </Layout>
          }
        />
        <Route
          path="/franchises"
          element={<Layout><FranchiseExplorer /></Layout>}
        />
        <Route
          path="/franchise/:id"
          element={<Layout><FranchiseDetails /></Layout>}
        />
        <Route
          path="/neural-search"
          element={
            <Layout>
              <NeuralDiscovery />
            </Layout>
          }
        />
        <Route
          path="/character/:id"
          element={
            <Layout>
              <Gallery />
            </Layout>
          }
        />
        <Route
          path="*"
          element={
            <Layout>
              <NotFound />
            </Layout>
          }
        />
      </Routes>
      <PWAStatus />
    </BrowserRouter>
  );
}

export default App;
