import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AnimeItem from "./Components/Animeitem.jsx";
import Homepage from "./Components/Homepage.jsx";
import Gallery from "./Components/Gallery.jsx";
import Navbar from "./Components/Navbar.jsx";
import Favourites from "./Components/Favourites.jsx";
import React from "react";
import AboutUs from "./Components/AboutUs.jsx";
import { useEffect } from "react";
import ScrollButton from "./Components/ScrollButton.jsx";

function Layout({ children }) {
  const location = useLocation();

  const showNavbar = location.pathname.startsWith("/anime");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      {showNavbar && <Navbar />}
      <div style={{ marginTop: showNavbar ? "70px" : "0px" }}>{children}</div>
      <ScrollButton />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/about" element={<AboutUs />} />
        {
          <Route
            path="/"
            element={
              <Layout>
                <Homepage />
              </Layout>
            }
          />
        }
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
        <Route path="/character/:id" element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
