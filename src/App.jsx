import React, { useEffect, Component } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import AnimeItem from "./Components/AnimeItem.jsx";
import Homepage from "./Components/Homepage.jsx";
import Gallery from "./Components/Gallery.jsx";
import NavbarNew from "./Components/NavbarNew.jsx";
import Favourites from "./Components/Favourites.jsx";
import AboutUs from "./Components/AboutUs.jsx";
import Watchlist from "./Components/Watchlist.jsx";
import MyReviews from "./Components/MyReviews.jsx";
import MyComments from "./Components/MyComments.jsx";
import Profile from "./Components/Profile.jsx";
import Trending from "./Components/Trending.jsx";
import Upcoming from "./Components/Upcoming.jsx";
import ScrollButton from "./Components/ScrollButton.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGlobalContext } from "./context/global.jsx";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

// Global Error Boundary to prevent black screen on runtime error
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production we suppress sensitive logs, but keep boundary responsive
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            color: "white",
            textAlign: "center",
            background: "#141414",
          }}
        >
          <AlertTriangle size={64} color="#ffd700" style={{ marginBottom: "1rem" }} />
          <h2 style={{ fontFamily: "Montserrat, sans-serif", fontSize: "1.8rem", color: "#ffd700", marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: "500px", marginBottom: "1.5rem" }}>
            We encountered an unexpected error while loading this view. Please try reloading or return to the homepage.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#ffd700",
                color: "#1a1a1a",
                border: "none",
                padding: "0.7rem 1.4rem",
                borderRadius: "20px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={16} /> Reload Page
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "0.7rem 1.4rem",
                borderRadius: "20px",
                fontWeight: 700,
                textDecoration: "none",
              }}
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

function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { setSearch } = useGlobalContext();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    // Clear global search state if navigating to any page other than homepage or details
    if (location.pathname !== "/" && !location.pathname.startsWith("/anime/")) {
      setSearch("");
    }
  }, [location.pathname, setSearch]);

  return (
    <>
      <NavbarNew />
      <div style={{ marginTop: isHome ? "0px" : "70px" }}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
      <ScrollButton />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ zIndex: 9999 }}
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
          path="/anime/:id"
          element={
            <Layout>
              <AnimeItem />
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
