import React from "react";
import { ArrowLeft, BookOpen, Home, Tv } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";
import Footer from "./Footer";

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col"><main className="min-h-[75vh] flex flex-1 items-center justify-center px-5 py-16">
      <SEO title="Page Not Found" description="This page could not be found on Anime Orbit." noIndex />
      <div className="w-full max-w-lg text-center">
        <ProgressiveImage
          src="/lost.jpg"
          alt="Zoro is lost"
          loading="eager"
          wrapperClassName="w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-full bg-white border border-white/10 shadow-2xl"
          className="w-full h-full object-contain p-5"
        />
        <span className="mt-7 block text-xs font-bold uppercase tracking-[0.2em] text-[#ffd700]">404 · Lost in orbit</span>
        <h1 className="mt-2 font-montserrat text-2xl sm:text-4xl font-bold tracking-tight">Even Zoro couldn’t find this page.</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">The anime or manga address may have changed, or this route never existed.</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white hover:border-white/30">
            <ArrowLeft size={16} /> Back
          </button>
          <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-[#ffd700] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#ffe44d]">
            <Home size={16} /> Home
          </Link>
          <Link to="/popular" className="inline-flex items-center gap-2 rounded-full border border-[#ffd700]/30 bg-[#ffd700]/[0.06] px-4 py-2.5 text-sm font-bold text-[#ffd700] hover:border-[#ffd700]">
            <Tv size={16} /> Browse anime
          </Link>
          <Link to="/manga" className="inline-flex items-center gap-2 rounded-full border border-[#bd82ff]/35 bg-[#bd82ff]/[0.07] px-4 py-2.5 text-sm font-bold text-[#d7b5ff] hover:border-[#bd82ff]">
            <BookOpen size={16} /> Browse manga
          </Link>
        </div>
      </div>
    </main><Footer /></div>
  );
};

export default NotFound;
