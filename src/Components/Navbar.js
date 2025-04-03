
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Sidebar from "./Sidebar"; 

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  width: 100%;
  background-color: black;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
`;

const Logo = styled(Link)`
  font-family: "Bungee", cursive;
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  &:hover {
    color: #facc15;
  }
`;

const MenuButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  &:hover {
    color: #facc15;
  }
`;

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <NavbarContainer>
        <Logo to="/">Anime Orbit</Logo>
        <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </MenuButton>
      </NavbarContainer>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
    </>
  );
};

export default Navbar;
