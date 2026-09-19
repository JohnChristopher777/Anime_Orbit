import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  MessageSquare,
  Search,
  LogIn,
  LogOut,
  Compass,
  BookOpen,
  Layers3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGlobalContext } from "../context/global";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar?: () => void;
  onClose?: () => void;
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  onClose,
  onOpenAuth,
}) => {
  const { currentUser, logout } = useAuth();
  const { searchAnime, setSearch } = useGlobalContext();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const handleClose = onClose || toggleSidebar || (() => {});
  const navClass = (path: string) => {
    const active = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
    return `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm border transition-colors ${active ? "bg-[#ffd700] border-[#ffd700] text-black [&>svg]:text-black" : "border-transparent text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10"}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
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
    } catch {
      // Graceful
    }
  };

  const handleLinkClick = (path: string) => {
    if (path === "/") {
      setSearch("");
    }
    handleClose();
  };

  return (
    <>
      {/* Dark Overlay */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 w-72 h-[100dvh] bg-[#121214]/95 backdrop-blur-xl border-r border-white/10 text-white z-[1110] flex flex-col transition-transform duration-300 ease-out shadow-2xl overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#121214] px-5">
          <div>
            <h3 className="font-montserrat text-lg font-bold text-[#ffd700]">Catalogue</h3>
          </div>
          <button onClick={handleClose} aria-label="Close Menu" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-[#ffd700] hover:bg-white/5 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex min-h-0 flex-1 flex-col space-y-1 overflow-y-auto overscroll-contain px-4 py-4">
          <Link
            to="/"
            onClick={() => handleLinkClick("/")}
            className={navClass("/")}
          >
            <Home size={18} className="text-[#ffd700]" />
            <span>Home</span>
          </Link>

          <Link
            to="/airing"
            onClick={() => handleLinkClick("/airing")}
            className={navClass("/airing")}
          >
            <TrendingUp size={18} className="text-[#ffd700]" />
            <span>Airing</span>
          </Link>

          <Link
            to="/upcoming"
            onClick={() => handleLinkClick("/upcoming")}
            className={navClass("/upcoming")}
          >
            <Calendar size={18} className="text-[#ffd700]" />
            <span>Upcoming</span>
          </Link>

          <Link
            to="/genres"
            onClick={() => handleLinkClick("/genres")}
            className={navClass("/genres")}
          >
            <Compass size={18} className="text-[#ffd700]" />
            <span>Genres</span>
          </Link>

          <Link
            to="/manga"
            onClick={() => handleLinkClick("/manga")}
            className={navClass("/manga")}
          >
            <BookOpen size={18} className="text-[#ffd700]" />
            <span>Manga Universe</span>
          </Link>

          <Link
            to="/discovery"
            onClick={() => handleLinkClick("/discovery")}
            className={navClass("/discovery")}
          >
            <Search size={18} className="text-[#ffd700]" />
            <span>Anime Discover</span>
          </Link>

          <Link
            to="/franchises"
            onClick={() => handleLinkClick("/franchises")}
            className={navClass("/franchises")}
          >
            <Layers3 size={18} className="text-[#ffd700]" />
            <span>Franchises</span>
          </Link>

          <Link
            to="/about"
            onClick={() => handleLinkClick("/about")}
            className={navClass("/about")}
          >
            <Info size={18} className="text-[#ffd700]" />
            <span>About Us</span>
          </Link>

          <div className="my-3 h-px w-full flex-shrink-0 bg-neutral-600/70" aria-hidden="true" />

          {currentUser && (
            <>
              <Link
                to="/favourites"
                onClick={() => handleLinkClick("/favourites")}
                className={navClass("/favourites")}
              >
                <Heart size={18} className="text-[#ffd700]" />
                <span>My Favorites</span>
              </Link>

              <Link
                to="/watchlist"
                onClick={() => handleLinkClick("/watchlist")}
                className={navClass("/watchlist")}
              >
                <List size={18} className="text-[#ffd700]" />
                <span>My Watchlist</span>
              </Link>

              <Link
                to="/my-reviews"
                onClick={() => handleLinkClick("/my-reviews")}
                className={navClass("/my-reviews")}
              >
                <MessageCircle size={18} className="text-[#ffd700]" />
                <span>My Reviews</span>
              </Link>

              <Link
                to="/my-comments"
                onClick={() => handleLinkClick("/my-comments")}
                className={navClass("/my-comments")}
              >
                <MessageSquare size={18} className="text-[#ffd700]" />
                <span>My Comments</span>
              </Link>
            </>
          )}
        </nav>

        {/* User Account / Sign In Bottom Section */}
        <div className="flex-shrink-0 border-t border-white/10 bg-[#121214] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" onClick={() => handleLinkClick("/profile")} className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border p-2 transition-colors ${location.pathname.startsWith("/profile") ? "border-[#ffd700] bg-[#ffd700]/10" : "border-transparent hover:bg-white/5"}`} aria-label="Open profile">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ffd700] bg-neutral-800 flex items-center justify-center text-[#ffd700]">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-montserrat font-bold text-sm text-white truncate">{currentUser.displayName || currentUser.email?.split("@")[0] || "User"}</p>
                  <span className="text-[11px] text-neutral-500">View profile</span>
                </div>
              </Link>
              <button
                onClick={handleLogoutClick}
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                handleClose();
                if (onOpenAuth) onOpenAuth();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-[#ffd700] to-[#ffea00] text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#ffd700]/20 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
