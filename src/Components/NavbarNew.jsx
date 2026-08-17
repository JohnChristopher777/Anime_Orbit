import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import Sidebar from "./Sidebar.jsx";
import AuthModal from "./AuthModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useGlobalContext } from "../context/global.jsx";
import { searchAnime as getSuggestions } from "../services/anilist";
import {
  User,
  LogOut,
  Heart,
  Menu,
  Home,
  Search,
  TrendingUp,
  List,
  Star,
  ChevronDown,
  Calendar,
  MessageCircle,
} from "lucide-react";

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  const { currentUser, logout } = useAuth();
  const { searchAnime, setSearch, search } = useGlobalContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Reset suggestions on route change
  useEffect(() => {
    setSuggestions([]);
    setShowSuggestions(false);
  }, [location.pathname]);

  const isHome = location.pathname === "/";
  const [scrolled, setScrolled] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }

    setScrolled(window.scrollY > 50);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // Debounced input change effect for suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await getSuggestions(searchQuery, 6);
        setSuggestions(results || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearch(searchQuery);
      searchAnime(searchQuery);
      setSearchQuery("");
      setShowSuggestions(false);
      navigate("/");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      <NavbarContainer $scrolled={scrolled}>
        <LeftSection>
          <MenuButton onClick={toggleSidebar} aria-label="Open Menu">
            <Menu size={24} />
          </MenuButton>

          <Logo to="/">
            <span className="anime">ANIME</span>
            <span className="orbit">ORBIT</span>
          </Logo>

          <NavLinks>
            <NavLink
              to="/"
              className={location.pathname === "/" && !search ? "active" : ""}
              onClick={() => setSearch("")}
            >
              <Home size={18} />
              <span>Home</span>
            </NavLink>
            <NavLink to="/trending" className={location.pathname === "/trending" ? "active" : ""}>
              <TrendingUp size={18} />
              <span>Airing</span>
            </NavLink>
            <NavLink to="/upcoming" className={location.pathname === "/upcoming" ? "active" : ""}>
              <Calendar size={18} />
              <span>Upcoming</span>
            </NavLink>
            {currentUser && (
              <NavLink to="/favourites" className={location.pathname === "/favourites" ? "active" : ""}>
                <Heart size={18} />
                <span>Favorites</span>
              </NavLink>
            )}
          </NavLinks>
        </LeftSection>

        <RightSection>
          <SearchForm onSubmit={handleSearch} ref={dropdownRef}>
            <SearchIcon>
              <Search size={20} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <SuggestionsDropdown>
                {suggestions.map((item) => (
                  <SuggestionItem
                    key={item.mal_id}
                    onClick={() => {
                      navigate(`/anime/${item.mal_id}`);
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                  >
                    <SuggestionImage
                      src={
                        item.images?.jpg?.small_image_url ||
                        item.images?.jpg?.image_url ||
                        ""
                      }
                      alt={item.title}
                    />
                    <SuggestionInfo>
                      <div className="title">
                        {item.title_english || item.title}
                      </div>
                      <div className="meta">
                        {item.type && <span>{item.type}</span>}
                        {item.score && (
                          <span className="score">★ {item.score}</span>
                        )}
                      </div>
                    </SuggestionInfo>
                  </SuggestionItem>
                ))}
              </SuggestionsDropdown>
            )}
          </SearchForm>

          <MobileHidden>
          {currentUser ? (
            <UserMenu>
              <UserButton onClick={() => setUserMenuOpen(!userMenuOpen)}>
                {currentUser.photoURL ? (
                  <UserAvatar src={currentUser.photoURL} alt="User" />
                ) : (
                  <User size={20} />
                )}
                <span className="username">
                  {currentUser.displayName || "User"}
                </span>
                <ChevronDown
                  size={16}
                  className={userMenuOpen ? "rotated" : ""}
                />
              </UserButton>

              {userMenuOpen && (
                <UserDropdown>
                  <DropdownItem
                    onClick={() => {
                      navigate("/profile");
                      setUserMenuOpen(false);
                    }}
                  >
                    <User size={18} />
                    <span>Profile</span>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      navigate("/favourites");
                      setUserMenuOpen(false);
                    }}
                  >
                    <Heart size={18} />
                    <span>Favorites</span>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      navigate("/watchlist");
                      setUserMenuOpen(false);
                    }}
                  >
                    <List size={18} />
                    <span>Watchlist</span>
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      navigate("/my-reviews");
                      setUserMenuOpen(false);
                    }}
                  >
                    <MessageCircle size={18} />
                    <span>My Reviews</span>
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem onClick={handleLogout} className="logout">
                    <LogOut size={18} />
                    <span>Logout</span>
                  </DropdownItem>
                </UserDropdown>
              )}
            </UserMenu>
          ) : (
            <SignInButton onClick={() => setAuthModalOpen(true)}>
              <User size={18} />
              <span>Sign In</span>
            </SignInButton>
          )}
          </MobileHidden>
        </RightSection>
      </NavbarContainer>

      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} onOpenAuth={() => setAuthModalOpen(true)} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
};

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  width: 100%;
  background: ${({ $scrolled }) =>
    $scrolled
      ? "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)"
      : "linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%)"};
  backdrop-filter: ${({ $scrolled }) => ($scrolled ? "blur(10px)" : "none")};
  color: white;
  padding: 0.8rem 3%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${({ $scrolled }) =>
    $scrolled
      ? "0px 4px 20px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 215, 0, 0.1)"
      : "none"};
  z-index: 1000;
  border-bottom: ${({ $scrolled }) =>
    $scrolled ? "1px solid rgba(255, 215, 0, 0.2)" : "1px solid transparent"};
  transition: all 0.3s ease-in-out;

  @media (max-width: 768px) {
    padding: 0.6rem 4%;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const MenuButton = styled.button`
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.6rem;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Logo = styled(Link)`
  font-family: "Shakuro", "Bungee", cursive;
  font-size: 2rem;
  font-weight: bold;
  text-decoration: none;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  transition: all 0.3s ease;

  .anime {
    color: #ffd700;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.6),
      0 0 30px rgba(255, 215, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.8);
  }

  .orbit {
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  }

  &:hover {
    transform: scale(1.05);

    .anime {
      text-shadow: 0 0 30px rgba(255, 215, 0, 0.9),
        0 0 40px rgba(255, 215, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8);
    }
  }

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
    transform: translateY(-2px);
  }

  &.active {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.4);
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 0.8rem;
  }
`;

const MobileHidden = styled.div`
  display: contents;
  @media (max-width: 768px) {
    display: none;
  }
`;

const SearchForm = styled.form`
  position: relative;
  display: flex;
  align-items: center;

  @media (max-width: 640px) {
    display: none;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  display: flex;
  align-items: center;
  z-index: 2;
`;

const SearchInput = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.7rem 1rem 0.7rem 3rem;
  border-radius: 25px;
  font-size: 0.9rem;
  font-family: "Montserrat", sans-serif;
  width: 300px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    outline: none;
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
    width: 350px;
  }

  @media (max-width: 1024px) {
    width: 200px;

    &:focus {
      width: 250px;
    }
  }
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: "Montserrat", sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.3s ease;

  .username {
    @media (max-width: 768px) {
      display: none;
    }
  }

  .rotated {
    transform: rotate(180deg);
  }

  &:hover {
    background: rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }
`;

const UserAvatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffd700;
`;

const UserDropdown = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: #1a1a1a;
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 0.5rem;
  min-width: 220px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.2);
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
  background: transparent;
  border: none;
  color: white;
  padding: 0.8rem 1rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-family: "Montserrat", sans-serif;
  font-weight: 500;
  font-size: 0.95rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.15);
    color: #ffd700;
  }

  &.logout {
    color: #ff4d4d;

    &:hover {
      background: rgba(255, 77, 77, 0.15);
      color: #ff6b6b;
    }
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
`;

const SignInButton = styled.button`
  background: linear-gradient(135deg, #ffd700 0%, #ffea00 100%);
  border: none;
  color: #1a1a1a;
  padding: 0.7rem 1.5rem;
  border-radius: 25px;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: "Montserrat", sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);

  span {
    @media (max-width: 768px) {
      display: none;
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SuggestionsDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: rgba(30, 30, 30, 0.98);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  max-height: 350px;
  overflow-y: auto;
  z-index: 1200;
  margin-top: 2px;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 3px;
  }
`;

const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
    border-radius: 0 0 10px 10px;
  }

  &:hover {
    background: rgba(255, 215, 0, 0.1);
  }
`;

const SuggestionImage = styled.img`
  width: 40px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  flex-shrink: 0;
`;

const SuggestionInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;

  .title {
    font-family: "Montserrat", sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .meta {
    font-family: "Inter", sans-serif;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    display: flex;
    gap: 0.5rem;

    .score {
      color: #ffd700;
      font-weight: 600;
    }
  }
`;

export default Navbar;
