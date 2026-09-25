import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import AuthModal from "./AuthModal";
import { useAuth } from "../context/AuthContext";
import { useGlobalContext } from "../context/global";
import { searchAnime as getSuggestions } from "../services/anilist";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import ProgressiveImage from "./ProgressiveImage";
import { useNotifications } from "../hooks/useNotifications";
import {
  User,
  LogOut,
  Heart,
  Menu,
  Search,
  TrendingUp,
  ListTodo,
  Star,
  ChevronDown,
  MessageCircle,
  MessageSquare,
  Compass,
  X,
  BookOpen,
  Bell,
} from "lucide-react";

export const Nav: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string>("");

  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { searchAnime, setSearch } = useGlobalContext();
  const navigate = useNavigate();
  const location = useLocation();

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const suggestionRequest = useRef(0);

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [avatarImgError, setAvatarImgError] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setUserPhoto("");
      return;
    }
    setUserPhoto(currentUser.photoURL || "");
    setAvatarImgError(false);

    getDoc(doc(db, "users", currentUser.uid))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.avatarUrl) {
            setUserPhoto(data.avatarUrl);
            setAvatarImgError(false);
          }
        }
      })
      .catch(() => {});

    const handleProfileUpdated = (e: any) => {
      if (e.detail && "avatarUrl" in e.detail) {
        setUserPhoto(e.detail.avatarUrl || "");
        setAvatarImgError(false);
      }
    };

    window.addEventListener("orbit_profile_updated", handleProfileUpdated);
    return () => window.removeEventListener("orbit_profile_updated", handleProfileUpdated);
  }, [currentUser]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileSearchOpen(false); };
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [mobileSearchOpen]);

  useEffect(() => {
    const query = searchQuery.trim();
    const requestId = ++suggestionRequest.current;
    if (query.length < 1) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      setShowSuggestions(true);
      try {
        const results = await getSuggestions(query, 6);
        if (requestId === suggestionRequest.current) setSuggestions(results);
      } catch {
        if (requestId === suggestionRequest.current) setSuggestions([]);
      } finally {
        if (requestId === suggestionRequest.current) setSuggestionsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideDesktopSearch = searchRef.current?.contains(target);
      const insideMobileSearch = mobileSearchRef.current?.contains(target);
      if (!insideDesktopSearch && !insideMobileSearch) {
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
      setMobileSearchOpen(false);
      navigate("/");
    }
  };

  const closeSearchAfterNavigation = () => {
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    setSearchQuery("");
  };

  const handleSuggestionClick = (animeId: number) => {
    navigate(`/anime/${animeId}`);
    closeSearchAfterNavigation();
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

  const isScrolled = scrolled || location.pathname !== "/" || mobileSearchOpen;
  const profileLabel = (currentUser?.displayName || currentUser?.email?.split("@")[0] || "User")
    .trim()
    .split(/\s+/)[0]
    .slice(0, 5);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 h-[64px] sm:h-[70px] z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#141414]/75 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.55)]"
            : "bg-gradient-to-b from-black/90 via-black/50 to-transparent border-b border-transparent"
        }`}
      >
        <div className="w-full h-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
          {/* Left Section: Menu Toggle & Glowing Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Navigation Menu"
              className="p-1.5 sm:p-2 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700]/20 hover:border-[#ffd700] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex-shrink-0"
            >
              <Menu size={18} className="sm:w-5 sm:h-5" />
            </button>

            <Link
              to="/"
              onClick={() => setSearch("")}
              className="flex items-center gap-1 font-montserrat font-bold text-lg sm:text-2xl tracking-tight transition-transform hover:scale-105 whitespace-nowrap flex-shrink-0"
            >
              <span className="text-[#ffd700] drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]">
                ANIME
              </span>
              <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Orbit
              </span>
            </Link>
          </div>

          {/* Center / Navigation Links (Visible on Large Screens) */}
          <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
            <Link
              to="/popular"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-montserrat font-semibold text-sm transition-all duration-200 border ${
                location.pathname === "/popular"
                  ? "bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                  : "border-transparent text-white/80 hover:text-[#ffd700] hover:bg-[#ffd700]/10"
              }`}
            >
              <Star size={16} />
              <span>Popular</span>
            </Link>

            <Link
              to="/airing"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-montserrat font-semibold text-sm transition-all duration-200 border ${
                location.pathname === "/airing"
                  ? "bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                  : "border-transparent text-white/80 hover:text-[#ffd700] hover:bg-[#ffd700]/10"
              }`}
            >
              <TrendingUp size={16} />
              <span>Airing</span>
            </Link>

            <Link
              to="/manga"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-montserrat font-semibold text-sm transition-all duration-200 border ${
                location.pathname === "/manga"
                  ? "bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                  : "border-transparent text-white/80 hover:text-[#ffd700] hover:bg-[#ffd700]/10"
              }`}
            >
              <BookOpen size={16} />
              <span>Manga</span>
            </Link>

            <Link
              to="/discovery"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-montserrat font-semibold text-sm transition-all duration-200 border ${
                location.pathname === "/discovery"
                  ? "bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                  : "border-transparent text-white/80 hover:text-[#ffd700] hover:bg-[#ffd700]/10"
              }`}
            >
              <Compass size={16} />
              <span>Discover</span>
            </Link>

            <Link
              to="/watchlist"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-montserrat font-semibold text-sm transition-all duration-200 border ${
                location.pathname === "/watchlist"
                  ? "bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                  : "border-transparent text-white/80 hover:text-[#ffd700] hover:bg-[#ffd700]/10"
              }`}
            >
              <ListTodo size={16} />
              <span>Watchlist</span>
            </Link>
          </div>

          {/* Right Section: Search & User Auth */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Desktop / Tablet Search Input (md and up) */}
            <div ref={searchRef} className="hidden md:block relative">
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center"
              >
                <Search
                  size={15}
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
                  className="w-44 lg:w-64 bg-white/[0.09] backdrop-blur-xl border border-white/20 focus:border-[#ffd700] text-white text-xs sm:text-sm pl-9 pr-8 py-1.5 sm:py-2 rounded-full outline-none transition-all duration-300 placeholder-neutral-400 focus:bg-white/[0.12] focus:shadow-[0_0_15px_rgba(255,215,0,0.18)]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="absolute right-3 text-neutral-400 hover:text-[#ffd700] transition-colors p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </form>

              {/* Desktop Suggestions Dropdown */}
              {showSuggestions && (suggestionsLoading || suggestions.length > 0) && (
                <div className="nav-search-results absolute top-full left-0 right-0 mt-2 bg-[#111116]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.95)] overflow-hidden max-h-80 overflow-y-auto z-50 divide-y divide-white/10">
                  {suggestionsLoading && <div className="nav-search-results__loading"><span /><span /><span /></div>}
                  {!suggestionsLoading && Array.from(
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
                        <ProgressiveImage
                          src={img}
                          alt={title}
                          wrapperClassName="w-9 h-12 rounded border border-[#ffd700]/20 flex-shrink-0"
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

            {/* Mobile Search Toggle Button (Screen < md) */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Toggle Search Bar"
              className={`md:hidden p-2 rounded-full border transition-all cursor-pointer ${
                mobileSearchOpen
                  ? "bg-[#ffd700] text-black border-[#ffd700]"
                  : "bg-white/5 border-white/15 text-neutral-300 hover:text-[#ffd700]"
              }`}
            >
              <Search size={16} />
            </button>

            <Link
              to="/digest"
              aria-label={unreadCount ? `Open notifications, ${unreadCount} unread` : "Open notifications and anime digest"}
              title={unreadCount ? `${unreadCount} unread notifications` : "Notifications and anime digest"}
              className={`nav-digest-bell nav-digest-bell--header ${location.pathname === "/digest" ? "is-active" : ""}`}
            >
              <Bell size={17} />
              {unreadCount > 0 && <span aria-hidden="true">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </Link>

            {/* User Profile or Sign In Button */}
            {currentUser ? (
              <div ref={userMenuRef} className="relative flex-shrink-0">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-[#ffd700]/10 border border-[#ffd700]/40 text-[#ffd700] hover:bg-[#ffd700]/20 hover:border-[#ffd700] px-2.5 sm:px-3 py-1 rounded-full font-montserrat font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer flex-shrink-0"
                >
                  <div className="w-6 h-6 rounded-full bg-[#ffd700]/20 border border-[#ffd700] flex items-center justify-center text-[#ffd700] overflow-hidden flex-shrink-0">
                    {userPhoto && !avatarImgError ? (
                      <img
                        src={userPhoto}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={() => setAvatarImgError(true)}
                      />
                    ) : (
                      <span className="font-montserrat font-bold text-[11px] text-[#ffd700]">
                        {(currentUser.displayName || currentUser.email || "U")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-white font-bold tracking-tight text-xs sm:text-sm">
                    {profileLabel}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 text-[#ffd700] ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-52 sm:w-56 bg-[#1a1a1a] border border-[#ffd700]/60 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(255,215,0,0.15)] p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      to="/digest"
                      onClick={() => setUserMenuOpen(false)}
                      className="nav-profile-digest md:hidden flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-200 hover:text-[#ffd700] hover:bg-[#ffd700]/10 rounded-xl transition-colors"
                    >
                      <span className="relative"><Bell size={16} />{unreadCount > 0 && <i aria-hidden="true" />}</span>
                      <span>{unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications & Digest"}</span>
                    </Link>
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
                      <ListTodo size={16} />
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
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors mt-1 border-t border-white/10 pt-2 w-full text-left cursor-pointer"
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
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#ffd700] to-[#ffea00] text-neutral-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-montserrat font-bold text-xs sm:text-sm hover:scale-105 hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] active:scale-95 transition-all duration-200 flex-shrink-0 cursor-pointer whitespace-nowrap"
              >
                <User size={14} className="sm:w-4 sm:h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact mobile search below the navbar */}
        {mobileSearchOpen && (
          <div ref={mobileSearchRef} className="md:hidden absolute top-full left-0 right-0 z-[60] border-b border-white/10 bg-[#141414]/95 px-3 py-2.5 shadow-[0_16px_35px_rgba(0,0,0,.65)] backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150" role="search" aria-label="Search anime">
            <div className="w-full max-w-xl mx-auto">
            <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex flex-1 items-center">
              <Search
                size={16}
                className="absolute left-3.5 text-[#ffd700] pointer-events-none"
              />
              <input
                id="mobile-search-input"
                name="mobileSearch"
                type="text"
                autoFocus
                placeholder="Search anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="w-full bg-white/[0.09] border border-white/20 focus:border-[#ffd700] text-white text-sm pl-10 pr-9 py-2.5 rounded-full outline-none transition-all placeholder-neutral-400 focus:bg-white/[0.12] focus:shadow-[0_0_16px_rgba(255,215,0,0.18)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3.5 text-neutral-400 hover:text-[#ffd700] transition-colors p-1 cursor-pointer"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </form>
            <button type="button" onClick={() => { setMobileSearchOpen(false); setShowSuggestions(false); }} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-white/20 bg-white/[0.09] text-neutral-300 hover:border-[#ffd700] hover:text-[#ffd700]" aria-label="Close search"><X size={17} /></button>
            </div>

            {/* Mobile Suggestions Dropdown */}
            {showSuggestions && (suggestionsLoading || suggestions.length > 0) && (
              <div className="nav-search-results mt-2.5 border border-white/15 rounded-xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-white/10 shadow-2xl">
                {suggestionsLoading && <div className="nav-search-results__loading"><span /><span /><span /></div>}
                {!suggestionsLoading && Array.from(
                  new Map(suggestions.map((item) => [item.mal_id, item])).values()
                ).map((anime, idx) => {
                  const title = anime.title_english || anime.title;
                  const img =
                    anime.images?.jpg?.image_url ||
                    anime.images?.jpg?.large_image_url;

                  return (
                    <Link
                      to={`/anime/${anime.mal_id}`}
                      key={`mob-sugg-${anime.mal_id}-${idx}`}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.preventDefault();
                        handleSuggestionClick(Number(anime.mal_id));
                      }}
                      className="flex w-full touch-manipulation items-center gap-3 bg-[#0f0f14]/95 p-3 text-left hover:bg-[#ffd700]/15 active:bg-[#ffd700]/25 cursor-pointer transition-colors"
                    >
                      <ProgressiveImage
                        src={img}
                        alt={title}
                        wrapperClassName="w-9 h-12 rounded-lg border border-[#ffd700]/30 flex-shrink-0"
                        className="w-9 h-12 object-cover rounded-lg border border-[#ffd700]/30 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-xs sm:text-sm font-semibold truncate">
                          {title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                          {anime.score && (
                            <span className="flex items-center gap-0.5 text-[#ffd700] font-bold">
                              <Star size={10} fill="#ffd700" />
                              {anime.score}
                            </span>
                          )}
                          <span>•</span>
                          <span>{anime.type || "TV"}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            {!suggestionsLoading && searchQuery.trim().length >= 1 && showSuggestions && suggestions.length === 0 && <div className="mt-2 rounded-xl border border-white/10 bg-[#15151b] p-4 text-center text-xs text-neutral-400">No matching anime found.</div>}
            </div>
          </div>
        )}
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
