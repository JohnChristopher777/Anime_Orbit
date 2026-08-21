import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import AnimeItem from "./Components/AnimeItem";
import Homepage from "./Components/Homepage";
import Gallery from "./Components/Gallery";
import Nav from "./Components/Nav";
import Favourites from "./Components/Favourites";
import AboutUs from "./Components/AboutUs";
import Watchlist from "./Components/Watchlist";
import MyReviews from "./Components/MyReviews";
import MyComments from "./Components/MyComments";
import Profile from "./Components/Profile";
import Trending from "./Components/Trending";
import Upcoming from "./Components/Upcoming";
import ScrollButton from "./Components/ScrollButton";
import Galaxy from "./Components/Galaxy";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGlobalContext } from "./context/global";
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

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
    // Gracefully handle without unhandled console errors
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

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#141414] text-white flex flex-col">
      {/* Ambient WebGL Galaxy Shader Background with Mobile Static Optimization */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <Galaxy
          mouseRepulsion={false}
          mouseInteraction={false}
          density={1}
          glowIntensity={0.4}
          saturation={0.7}
          hueShift={170}
          twinkleIntensity={0.8}
          rotationSpeed={0.05}
          repulsionStrength={0}
          autoCenterRepulsion={0}
          starSpeed={0.1}
          speed={0.2}
          transparent={true}
          disableAnimation={isMobile}
        />
      </div>

      <Nav />
      <div className={`relative z-10 flex-1 ${isHome ? "mt-0" : "mt-[70px]"}`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
      <ScrollButton />
    </div>
  );
}

import Genres from "./Components/Genres";
import Manga from "./Components/Manga";
import MangaItem from "./Components/MangaItem";
import PublicProfile from "./Components/PublicProfile";

export function App() {
  return (
    <BrowserRouter>
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
          path="/watchlist"
          element={
            <Layout>
              <Watchlist />
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
          path="/upcoming"
          element={
            <Layout>
              <Upcoming />
            </Layout>
          }
        />
        <Route path="/character/:id" element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
