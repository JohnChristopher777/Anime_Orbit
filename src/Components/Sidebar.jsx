import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  Home,
  Info,
  Heart,
  User,
  List,
  X,
  Calendar,
  TrendingUp,
  MessageCircle,
  Search,
  LogIn,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useGlobalContext } from "../context/global.jsx";

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: ${({ $isOpen }) => ($isOpen ? "0" : "-280px")};
  width: 280px;
  height: 100vh;
  background: rgba(20, 20, 20, 0.98);
  backdrop-filter: blur(15px);
  border-right: 1px solid rgba(255, 215, 0, 0.15);
  color: white;
  display: flex;
  flex-direction: column;
  padding: 80px 1.5rem 2rem 1.5rem;
  transition: left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: ${({ $isOpen }) =>
    $isOpen ? "10px 0px 30px rgba(0, 0, 0, 0.7)" : "none"};
  z-index: 1100;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  color: #ffd700;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    color: white;
    transform: rotate(90deg);
  }
`;

const SidebarSearch = styled.form`
  display: none;
  width: 100%;
  position: relative;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-family: "Montserrat", sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  display: flex;
  align-items: center;
`;

const SidebarLink = styled(Link)`
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-family: "Montserrat", sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin: 6px 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  width: 100%;

  &:hover {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
    transform: translateX(5px);
  }

  svg {
    color: #ffd700;
    flex-shrink: 0;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.75rem 0;
`;

const SidebarUserSection = styled.div`
  display: none;
  width: 100%;
  margin-top: auto;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  font-family: "Montserrat", sans-serif;
  margin-bottom: 0.5rem;

  img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid #ffd700;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid #ffd700;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 215, 0, 0.1);
  }

  .username {
    font-weight: 600;
    font-size: 0.95rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const AuthButton = styled.button`
  width: 100%;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &.signin {
    background: linear-gradient(135deg, #ffd700 0%, #ffea00 100%);
    color: #1a1a1a;
    border: none;
    box-shadow: 0 4px 10px rgba(255, 215, 0, 0.2);

    &:hover {
      box-shadow: 0 6px 15px rgba(255, 215, 0, 0.4);
      transform: translateY(-2px);
    }
  }

  &.signout {
    background: rgba(255, 77, 77, 0.1);
    border: 1.5px solid rgba(255, 77, 77, 0.3);
    color: #ff4d4d;

    &:hover {
      background: #ff4d4d;
      color: white;
      transform: translateY(-2px);
    }
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1099;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  pointer-events: ${({ $isOpen }) => ($isOpen ? "auto" : "none")};
  transition: opacity 0.3s ease;
`;

const Sidebar = ({ isOpen, toggleSidebar, onClose, onOpenAuth }) => {
  const { currentUser, logout } = useAuth();
  const { searchAnime, setSearch } = useGlobalContext();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const handleClose = onClose || toggleSidebar;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearch(searchQuery);
      searchAnime(searchQuery);
      setSearchQuery("");
      handleClose();
      navigate("/");
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      handleClose();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLinkClick = (path) => {
    if (path === "/") {
      setSearch("");
    }
    handleClose();
  };

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={handleClose} />
      <SidebarContainer $isOpen={isOpen}>
        <CloseButton onClick={handleClose} aria-label="Close Menu">
          <X size={24} />
        </CloseButton>

        <SidebarSearch onSubmit={handleSearchSubmit}>
          <SearchIconWrapper>
            <Search size={18} />
          </SearchIconWrapper>
          <SearchInput
            type="text"
            placeholder="Search anime..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SidebarSearch>

        <SidebarLink to="/" onClick={() => handleLinkClick("/")}>
          <Home size={18} /> Home
        </SidebarLink>

        <SidebarLink to="/trending" onClick={() => handleLinkClick("/trending")}>
          <TrendingUp size={18} /> Airing
        </SidebarLink>

        <SidebarLink to="/upcoming" onClick={() => handleLinkClick("/upcoming")}>
          <Calendar size={18} /> Upcoming
        </SidebarLink>

        <SidebarLink to="/about" onClick={() => handleLinkClick("/about")}>
          <Info size={18} /> About Us
        </SidebarLink>

        {currentUser && (
          <>
            <Divider />
            <SidebarLink to="/profile" onClick={() => handleLinkClick("/profile")}>
              <User size={18} /> Profile
            </SidebarLink>

            <SidebarLink to="/favourites" onClick={() => handleLinkClick("/favourites")}>
              <Heart size={18} /> My Favourites
            </SidebarLink>

            <SidebarLink to="/watchlist" onClick={() => handleLinkClick("/watchlist")}>
              <List size={18} /> My Watchlist
            </SidebarLink>

            <SidebarLink to="/my-reviews" onClick={() => handleLinkClick("/my-reviews")}>
              <MessageCircle size={18} /> My Reviews
            </SidebarLink>
          </>
        )}

        <SidebarUserSection>
          {currentUser ? (
            <>
              <UserProfile>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User Avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={20} color="#ffd700" />
                  </div>
                )}
                <span className="username">
                  {currentUser.displayName || currentUser.email?.split("@")[0]}
                </span>
              </UserProfile>
              <AuthButton className="signout" onClick={handleLogoutClick}>
                <LogOut size={16} /> Sign Out
              </AuthButton>
            </>
          ) : (
            <AuthButton
              className="signin"
              onClick={() => {
                handleClose();
                if (onOpenAuth) onOpenAuth();
              }}
            >
              <LogIn size={16} /> Sign In
            </AuthButton>
          )}
        </SidebarUserSection>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;
