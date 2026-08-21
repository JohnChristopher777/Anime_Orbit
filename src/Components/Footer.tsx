import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowUp, Compass, Heart, List, User, Flame, Calendar, Layers } from "lucide-react";

export const Footer: React.FC = () => {
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#0c0c10] border-t-2 border-[#ffd700]/30 pt-14 pb-8 px-6 sm:px-12 text-white font-inter mt-auto overflow-hidden">
      {/* Golden Cosmic Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-32 bg-[#ffd700]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-32 bg-[#ffea00]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10 relative z-10">
        {/* Col 1: Brand & Tagline */}
        <div className="space-y-3">
          <Link
            to="/"
            onClick={handleScrollTop}
            className="flex items-center gap-1.5 font-montserrat font-black text-2xl tracking-tight"
          >
            <span className="text-[#ffd700] drop-shadow-[0_0_18px_rgba(255,215,0,0.7)]">
              ANIME
            </span>
            <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Orbit
            </span>
          </Link>
          <p className="text-xs text-neutral-300 leading-relaxed max-w-xs">
            Your cosmic universe compass across every anime genre. Explore episode guides, character artwork, tier list rankings, and synced community tracking.
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs font-bold text-[#ffd700]">
            <Sparkles size={14} className="text-[#ffd700] animate-pulse" />
            <span>Built for true anime enthusiasts</span>
          </div>
        </div>

        {/* Col 2: Explore Channels */}
        <div>
          <h4 className="font-montserrat font-bold text-sm text-[#ffd700] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Compass size={15} />
            <span>Explore Universe</span>
          </h4>
          <ul className="space-y-2.5 text-xs text-neutral-300">
            <li>
              <Link to="/" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <Flame size={13} className="text-[#ffd700]" />
                <span>Popular Masterpieces</span>
              </Link>
            </li>
            <li>
              <Link to="/trending" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <Flame size={13} className="text-[#ffd700]" />
                <span>Top Airing Series</span>
              </Link>
            </li>
            <li>
              <Link to="/upcoming" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <Calendar size={13} className="text-[#ffd700]" />
                <span>Upcoming Releases</span>
              </Link>
            </li>
            <li>
              <Link to="/genres" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <Layers size={13} className="text-[#ffd700]" />
                <span>Genre Universe Explorer</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Personal Hub */}
        <div>
          <h4 className="font-montserrat font-bold text-sm text-[#ffd700] uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={15} />
            <span>Personal Hub</span>
          </h4>
          <ul className="space-y-2.5 text-xs text-neutral-300">
            <li>
              <Link to="/watchlist" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <List size={13} className="text-[#ffd700]" />
                <span>My Watchlist</span>
              </Link>
            </li>
            <li>
              <Link to="/favourites" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <Heart size={13} className="text-[#ffd700]" />
                <span>Favorites & Tier List</span>
              </Link>
            </li>
            <li>
              <Link to="/profile" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <User size={13} className="text-[#ffd700]" />
                <span>Profile & Custom Avatar</span>
              </Link>
            </li>
            <li>
              <Link to="/about" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <Compass size={13} className="text-[#ffd700]" />
                <span>About Anime Orbit</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Manga & Community */}
        <div>
          <h4 className="font-montserrat font-bold text-sm text-[#ffd700] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles size={15} />
            <span>Manga & Community</span>
          </h4>
          <ul className="space-y-2.5 text-xs text-neutral-300">
            <li>
              <Link to="/my-reviews" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <Sparkles size={13} className="text-[#ffd700]" />
                <span>My Anime Reviews</span>
              </Link>
            </li>
            <li>
              <Link to="/my-comments" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <Sparkles size={13} className="text-[#ffd700]" />
                <span>Community Discussions</span>
              </Link>
            </li>
            <li>
              <Link to="/about" onClick={handleScrollTop} className="hover:text-[#ffd700] transition-colors flex items-center gap-2">
                <Compass size={13} className="text-[#ffd700]" />
                <span>How Stories Are Born</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#ffd700]/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-neutral-400">
        <div>
          © {new Date().getFullYear()} <span className="text-[#ffd700] font-bold">Anime Orbit</span> | All anime, manga artwork, and metadata belong to their respective creators.
        </div>
     
      </div>
    </footer>
  );
};

export default Footer;
