import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AnimeItem from "./Components/Animeitem";
import Homepage from "./Components/Homepage";
import Gallery from "./Components/Gallery";
import Navbar from "./Components/Navbar";
import React from "react";
import Login from "./Components/Login";
import AboutUs from "./Components/AboutUs";
import { useEffect } from "react";

function Layout({ children }) {
  const location = useLocation();

  // Show Navbar only on Homepage ("/") & AnimeItem ("/anime/:id")
  const showNavbar = location.pathname.startsWith("/anime");

  useEffect(() => {
    window.scrollTo(0, 0); // Auto scroll to top on route change
  }, [location]);

  return (
    <>
      {showNavbar && <Navbar />}
      <div style={{ marginTop: showNavbar ? "70px" : "0px" }}>{children}</div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/about" element={<AboutUs />} />
      <Route path="/login" element={<Login />} />
        {<Route path="/" element={<Layout><Homepage /></Layout>} /> }
        <Route path="/anime/:id" element={<Layout><AnimeItem /></Layout>} />
        <Route path="/character/:id" element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;



