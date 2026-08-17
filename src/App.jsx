import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AnimeItemEnhanced from "./Components/AnimeItemEnhanced.jsx";
import Homepage from "./Components/Homepage.jsx";
import Gallery from "./Components/Gallery.jsx";
import NavbarNew from "./Components/NavbarNew.jsx";
import Favourites from "./Components/Favourites.jsx";
import React from "react";
import AboutUs from "./Components/AboutUs.jsx";
import Watchlist from "./Components/Watchlist.jsx";
import MyReviews from "./Components/MyReviews.jsx";
import Profile from "./Components/Profile.jsx";
import Trending from "./Components/Trending.jsx";
import Upcoming from "./Components/Upcoming.jsx";
import { useEffect } from "react";
import ScrollButton from "./Components/ScrollButton.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGlobalContext } from "./context/global.jsx";

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
      <div style={{ marginTop: isHome ? "0px" : "70px" }}>{children}</div>
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
              <AnimeItemEnhanced />
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
