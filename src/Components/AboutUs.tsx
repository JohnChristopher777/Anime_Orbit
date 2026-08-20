import React from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Sparkles,
  Shield,
  Zap,
  Layers,
  Flame,
  ArrowRight,
  Database,
} from "lucide-react";

export const AboutUs: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#ffd700]/15 border border-[#ffd700]/40 text-[#ffd700] px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider font-montserrat">
          <Sparkles size={14} />
          <span>About Anime Orbit</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black font-staatliches uppercase tracking-wider text-white">
          The Ultimate Interactive Anime Database
        </h1>
        <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
          Anime Orbit is a state-of-the-art anime multiverse discovery hub. Featuring real-time ratings, full chronological relation timelines, episode guides for 1000+ episode series, community discussions, and personal watchlist sync.
        </p>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-neutral-900/60 border border-white/10 hover:border-[#ffd700]/40 rounded-2xl space-y-3 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] flex items-center justify-center">
            <Zap size={24} />
          </div>
          <h3 className="font-montserrat font-bold text-lg text-white">
            AniList GraphQL Engine
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Ultra-fast, rich metadata including true animation studios, production companies, airing countdowns, and character voice actors.
          </p>
        </div>

        <div className="p-6 bg-neutral-900/60 border border-white/10 hover:border-[#ffd700]/40 rounded-2xl space-y-3 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] flex items-center justify-center">
            <Layers size={24} />
          </div>
          <h3 className="font-montserrat font-bold text-lg text-white">
            Chronological Relations
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Explore anime timelines sorted strictly by Original Manga/Novel, Prequels/Sequels, Side Stories, and Movies in vertical portrait posters.
          </p>
        </div>

        <div className="p-6 bg-neutral-900/60 border border-white/10 hover:border-[#ffd700]/40 rounded-2xl space-y-3 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] flex items-center justify-center">
            <Shield size={24} />
          </div>
          <h3 className="font-montserrat font-bold text-lg text-white">
            Cloud Watchlist & Reviews
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Secure cloud persistence for your watching status, favorite anime, reviews, and community comments across devices.
          </p>
        </div>
      </div>

      {/* Tech Stack Badge Row */}
      <div className="p-6 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
        <h3 className="text-sm font-extrabold font-montserrat uppercase tracking-wider text-[#ffd700]">
          Built with Modern Web Technologies
        </h3>
        <div className="flex flex-wrap gap-2 text-xs font-bold font-montserrat">
          {[
            "React 19",
            "TypeScript",
            "Tailwind CSS",
            "OGL WebGL Shaders",
            "GSAP",
            "Firebase Firestore",
            "AniList GraphQL API",
            "Framer Motion",
            "Vite",
          ].map((tech) => (
            <span
              key={tech}
              className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-neutral-200"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-extrabold px-8 py-3.5 rounded-full text-sm font-montserrat shadow-xl hover:scale-105 transition-all"
        >
          <span>Start Exploring Anime</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};

export default AboutUs;
