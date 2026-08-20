import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import AuthModal from "./AuthModal";
import { useAuth } from "../context/AuthContext";
import { useGlobalContext } from "../context/global";
import { searchAnime as getSuggestions } from "../services/anilist";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
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
  MessageSquare,
} from "lucide-react";

export const Nav: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string>("");

  const { currentUser, logout } = useAuth();
  const { searchAnime, setSearch } = useGlobalContext();
  const navigate = useNavigate();
  const location = useLocation();

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) {
      setUserPhoto("");
      return;
    }
    setUserPhoto(currentUser.photoURL || "");
    getDoc(doc(db, "users", currentUser.uid))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.avatarUrl) {
            setUserPhoto(data.avatarUrl);
          }
        }
      })
      .catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await getSuggestions(searchQuery, 5);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearch(searchQuery);
      searchAnime(searchQuery);
      setShowSuggestions(false);
      navigate("/");
    }
  };

  const handleSuggestionClick = (animeId: number) => {
    setShowSuggestions(false);
    setSearchQuery("");
    navigate(`/anime/${animeId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      navigate("/");
    } catch {
      // Graceful
    }
  };

  const isScrolled = scrolled || location.pathname !== "/";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 h-[70px] z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#141414]/95 backdrop-blur-md border-b border-[#ffd700]/20 shadow-[0_4px_25px_rgba(0,0,0,0.7)]"
            : "bg-gradient-to-b from-black/90 via-black/50 to-transparent border-b border-transparent"
        }`}
      >
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-8">
          {/* Left Section: Menu Toggle & Glowing Logo */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 mr-2 sm:mr-4">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Menu"
              className="p-2 sm:p-2.5 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700]/20 hover:border-[#ffd700] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex-shrink-0"
            >
              <Menu size={20} />
            </button>

            <Link
              to="/"
              onClick={() => setSearch("")}
              className="flex items-center gap-1.5 font-montserrat font-black text-xl sm:text-2xl tracking-tight transition-transform hover:scale-105 whitespace-nowrap flex-shrink-0"
            >
              <span className="text-[#ffd700] drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]">
                ANIME
              </span>
              <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Orbit
              </span>
            </Link>
          </div>

          {/* Center / Navigation Links */}
          <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
          <Link
            to="/"
            onClick={() => setSearch("")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-montserrat font-semibold text-sm transition-all duration-200 border ${
              location.pathname === "/"
                ? "bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                : "border-transparent text-white/80 hover:text-[#ffd700] hover:bg-[#ffd700]/10"
            }`}
          >
            <Home size={16} />
            <span>Home</span>
          </Link>

          <Link
            to="/trending"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-montserrat font-semibold text-sm transition-all duration-200 border ${
              location.pathname === "/trending"
                ? "bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                : "border-transparent text-white/80 hover:text-[#ffd700] hover:bg-[#ffd700]/10"
            }`}
          >
            <TrendingUp size={16} />
            <span>Airing</span>
          </Link>

          <Link
            to="/upcoming"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-montserrat font-semibold text-sm transition-all duration-200 border ${
              location.pathname === "/upcoming"
                ? "bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                : "border-transparent text-white/80 hover:text-[#ffd700] hover:bg-[#ffd700]/10"
            }`}
          >
            <Calendar size={16} />
            <span>Upcoming</span>
          </Link>

          <Link
            to="/watchlist"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-montserrat font-semibold text-sm transition-all duration-200 border ${
              location.pathname === "/watchlist"
                ? "bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                : "border-transparent text-white/80 hover:text-[#ffd700] hover:bg-[#ffd700]/10"
            }`}
          >
            <List size={16} />
            <span>Watchlist</span>
          </Link>
        </div>

        {/* Right Section: Search Bar & Auth/User Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search Box */}
          <div ref={searchRef} className="relative">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center"
            >
              <Search
                size={16}
                className="absolute left-3.5 text-neutral-400 pointer-events-none"
              />
              <input
                id="navbar-search-input"
                name="navbarSearch"
                type="text"
                placeholder="Search anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="w-36 sm:w-56 md:w-64 lg:w-72 bg-white/5 border border-white/15 focus:border-[#ffd700] text-white text-xs sm:text-sm pl-9 sm:pl-10 pr-4 py-2 rounded-full outline-none transition-all duration-300 placeholder-neutral-500 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(255,215,0,0.25)]"
              />
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f0f14]/98 backdrop-blur-2xl border border-[#ffd700]/30 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.95)] overflow-hidden max-h-80 overflow-y-auto z-50 divide-y divide-white/10">
                {Array.from(
                  new Map(suggestions.map((item) => [item.mal_id, item])).values()
                ).map((anime, idx) => {
                  const title = anime.title_english || anime.title;
                  const img =
                    anime.images?.jpg?.image_url ||
                    anime.images?.jpg?.large_image_url;

                  return (
                    <div
                      key={`sugg-${anime.mal_id}-${idx}`}
                      onClick={() => handleSuggestionClick(anime.mal_id)}
                      className="flex items-center gap-3 p-2.5 bg-[#0f0f14]/95 hover:bg-[#ffd700]/15 cursor-pointer transition-colors"
                    >
                      <img
                        src={img}
                        alt={title}
                        className="w-9 h-12 object-cover rounded border border-[#ffd700]/20 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-xs sm:text-sm font-semibold truncate">
                          {title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          {anime.score && (
                            <span className="flex items-center gap-0.5 text-[#ffd700] font-bold">
                              <Star size={11} fill="#ffd700" />
                              {anime.score}
                            </span>
                          )}
                          <span>•</span>
                          <span>{anime.type || "TV"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Profile or Sign In Button */}
          {currentUser ? (
            <div ref={userMenuRef} className="relative flex-shrink-0">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 bg-[#ffd700]/10 border border-[#ffd700]/40 text-[#ffd700] hover:bg-[#ffd700]/20 hover:border-[#ffd700] px-2.5 py-1 rounded-full font-montserrat font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer flex-shrink-0"
              >
                <div className="w-6 h-6 rounded-full bg-[#ffd700]/25 border border-[#ffd700] flex items-center justify-center text-[#ffd700] overflow-hidden flex-shrink-0">
                  {userPhoto || currentUser.photoURL ? (
                    <img
                      src={userPhoto || currentUser.photoURL || ""}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <User size={13} className="text-[#ffd700]" />
                  )}
                </div>
                <span className="text-white font-bold tracking-tight">
                  {(currentUser.displayName ||
                    currentUser.email?.split("@")[0] ||
                    "User").slice(0, 5)}
                </span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 text-[#ffd700] ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#ffd700]/60 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(255,215,0,0.15)] p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-200 hover:text-[#ffd700] hover:bg-[#ffd700]/10 rounded-xl transition-colors"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/favourites"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-200 hover:text-[#ffd700] hover:bg-[#ffd700]/10 rounded-xl transition-colors"
                  >
                    <Heart size={16} />
                    <span>My Favorites</span>
                  </Link>
                  <Link
                    to="/watchlist"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-200 hover:text-[#ffd700] hover:bg-[#ffd700]/10 rounded-xl transition-colors"
                  >
                    <List size={16} />
                    <span>My Watchlist</span>
                  </Link>
                  <Link
                    to="/my-reviews"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-200 hover:text-[#ffd700] hover:bg-[#ffd700]/10 rounded-xl transition-colors"
                  >
                    <MessageCircle size={16} />
                    <span>My Reviews</span>
                  </Link>
                  <Link
                    to="/my-comments"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-200 hover:text-[#ffd700] hover:bg-[#ffd700]/10 rounded-xl transition-colors"
                  >
                    <MessageSquare size={16} />
                    <span>My Comments</span>
                  </Link>
                  <div className="h-px bg-white/10 my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-xl transition-colors text-left w-full cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#ffd700] to-[#ffea00] text-neutral-900 px-3.5 sm:px-5 py-2 rounded-full font-montserrat font-extrabold text-xs sm:text-sm hover:scale-105 hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] active:scale-95 transition-all duration-200 flex-shrink-0 cursor-pointer"
            >
              <User size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
        </div>
      </nav>

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onClose={() => setSidebarOpen(false)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
};

export default Nav;
