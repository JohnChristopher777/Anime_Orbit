import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  const location = useLocation();

  const showNavbar = location.pathname === "/" || location.pathname.startsWith("/anime");

  useEffect(() => {
    window.scrollTo(0, 0); 
  }, [location]);

  return (
    <>
      {showNavbar && <Navbar />}
      <div style={{ marginTop: showNavbar ? "70px" : "0px" }}>{children}</div>
    </>
  );
};

export default Layout;
 