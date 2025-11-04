import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Sidebar from "./Sidebar.jsx";
import AuthModal from "./AuthModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { FaUser, FaSignOutAlt, FaHeart } from "react-icons/fa";

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
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    color: #ffd700;
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.8),
      0 0 40px rgba(255, 215, 0, 0.5);
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserButton = styled.button`
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid #ffd700;
  color: #ffd700;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: #ffd700;
    color: #1a1a1a;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.7rem;
    font-size: 0.8rem;
  }
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserDropdown = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: #1a1a1a;
  border: 2px solid #ffd700;
  border-radius: 10px;
  padding: 0.5rem 0;
  min-width: 200px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.isOpen ? "block" : "none")};
  animation: slideDown 0.3s ease;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 0.8rem 1.5rem;
  background: transparent;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;

  &:hover {
    background: rgba(255, 215, 0, 0.1);
    color: #ffd700;
  }
`;

const UserName = styled.div`
  padding: 0.8rem 1.5rem;
  color: #ffd700;
  font-weight: bold;
  border-bottom: 1px solid #333;
  font-size: 0.9rem;
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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <NavbarContainer>
        <Logo to="/">Anime Orbit</Logo>
        <NavActions>
          {currentUser ? (
            <UserMenu>
              <UserButton onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <FaUser />
                <span>{currentUser.displayName?.split(" ")[0] || "User"}</span>
              </UserButton>
              <UserDropdown isOpen={userMenuOpen}>
                <UserName>
                  {currentUser.displayName || currentUser.email}
                </UserName>
                <DropdownItem
                  onClick={() => {
                    setUserMenuOpen(false);
                  }}
                >
                  <Link
                    to="/favourites"
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      width: "100%",
                    }}
                  >
                    <FaHeart /> My Favourites
                  </Link>
                </DropdownItem>
                <DropdownItem onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </DropdownItem>
              </UserDropdown>
            </UserMenu>
          ) : (
            <UserButton onClick={() => setAuthModalOpen(true)}>
              <FaUser />
              <span>Sign In</span>
            </UserButton>
          )}
          <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </MenuButton>
        </NavActions>
      </NavbarContainer>
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
