import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const handleClose = onClose || toggleSidebar || (() => {});

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
        className={`fixed top-0 left-0 w-72 h-full bg-[#121214]/95 backdrop-blur-xl border-r border-white/10 text-white z-[1110] flex flex-col p-6 pt-16 transition-transform duration-300 ease-out shadow-2xl overflow-y-auto overscroll-contain ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close Menu"
          className="absolute top-5 right-5 text-[#ffd700] hover:text-white transition-colors p-1"
        >
          <X size={24} />
        </button>

        {/* Sidebar Header Title */}
        <div className="mb-6">
          <h3 className="text-2xl text-[#ffd700] mt-0.5">
            Catalogue
          </h3>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-1">
          <Link
            to="/"
            onClick={() => handleLinkClick("/")}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
          >
            <Home size={18} className="text-[#ffd700]" />
            <span>Home</span>
          </Link>

          <Link
            to="/trending"
            onClick={() => handleLinkClick("/trending")}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
          >
            <TrendingUp size={18} className="text-[#ffd700]" />
            <span>Airing</span>
          </Link>

          <Link
            to="/upcoming"
            onClick={() => handleLinkClick("/upcoming")}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
          >
            <Calendar size={18} className="text-[#ffd700]" />
            <span>Upcoming</span>
          </Link>

          <Link
            to="/genres"
            onClick={() => handleLinkClick("/genres")}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
          >
            <Compass size={18} className="text-[#ffd700]" />
            <span>Genres</span>
          </Link>

          <Link
            to="/manga"
            onClick={() => handleLinkClick("/manga")}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
          >
            <BookOpen size={18} className="text-[#ffd700]" />
            <span>Manga Universe</span>
          </Link>

          <Link
            to="/about"
            onClick={() => handleLinkClick("/about")}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
          >
            <Info size={18} className="text-[#ffd700]" />
            <span>About Us</span>
          </Link>

          {currentUser && (
            <>
              <div className="w-full h-px bg-white/10 my-3" />

              <Link
                to="/profile"
                onClick={() => handleLinkClick("/profile")}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
              >
                <User size={18} className="text-[#ffd700]" />
                <span>Profile</span>
              </Link>

              <Link
                to="/favourites"
                onClick={() => handleLinkClick("/favourites")}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
              >
                <Heart size={18} className="text-[#ffd700]" />
                <span>My Favorites</span>
              </Link>

              <Link
                to="/watchlist"
                onClick={() => handleLinkClick("/watchlist")}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
              >
                <List size={18} className="text-[#ffd700]" />
                <span>My Watchlist</span>
              </Link>

              <Link
                to="/my-reviews"
                onClick={() => handleLinkClick("/my-reviews")}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
              >
                <MessageCircle size={18} className="text-[#ffd700]" />
                <span>My Reviews</span>
              </Link>

              <Link
                to="/my-comments"
                onClick={() => handleLinkClick("/my-comments")}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-montserrat font-bold text-sm text-neutral-300 hover:text-[#ffd700] hover:bg-[#ffd700]/10 transition-colors"
              >
                <MessageSquare size={18} className="text-[#ffd700]" />
                <span>My Comments</span>
              </Link>
            </>
          )}
        </nav>

        {/* User Account / Sign In Bottom Section */}
        <div className="mt-auto pt-6 border-t border-white/10">
          {currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ffd700] bg-neutral-800 flex items-center justify-center text-[#ffd700]">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-montserrat font-bold text-sm text-white truncate">
                    {(currentUser.displayName || currentUser.email?.split("@")[0] || "User").slice(0, 5)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogoutClick}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
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
