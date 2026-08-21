import React, { useState, useEffect, memo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGlobalContext } from "../context/global";
import SEO from "./SEO";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { getCharacterDetails } from "../services/anilist";

export const Gallery: React.FC = () => {
  const { getAnimePictures, pictures } = useGlobalContext();
  const { id } = useParams<{ id: string }>();
  const [characterName, setCharacterName] = useState("Loading...");
  const [index, setIndex] = useState(0);
  const [optimizedPictures, setOptimizedPictures] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const fetchCharacterName = async () => {
      try {
        const data = await getCharacterDetails(id);
        if (isMounted) {
          setCharacterName(data?.name?.full || "Unknown Character");
        }
      } catch {
        if (isMounted) {
          setCharacterName("Character Gallery");
        }
      }
    };

    fetchCharacterName();
    getAnimePictures(id);

    return () => {
      isMounted = false;
    };
  }, [id, getAnimePictures]);

  useEffect(() => {
    if (pictures && pictures.length > 0) {
      setOptimizedPictures(pictures);
    }
  }, [pictures]);

  const handlePrev = useCallback(() => {
    if (optimizedPictures.length === 0) return;
    setIndex((prevIndex) => (prevIndex === 0 ? optimizedPictures.length - 1 : prevIndex - 1));
  }, [optimizedPictures.length]);

  const handleNext = useCallback(() => {
    if (optimizedPictures.length === 0) return;
    setIndex((prevIndex) => (prevIndex === optimizedPictures.length - 1 ? 0 : prevIndex + 1));
  }, [optimizedPictures.length]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const currentImage =
    optimizedPictures[index]?.jpg?.image_url ||
    optimizedPictures[index]?.image ||
    "";

  return (
    <div className="min-h-screen bg-[#121214] text-white pt-28 sm:pt-32 pb-12 px-6 sm:px-10 flex flex-col font-inter relative">
      <SEO
        title={`${characterName} - Character Artwork & Gallery`}
        description={`Browse official anime character artwork, illustrations, and pictures for ${characterName} on Anime Orbit.`}
        keywords={`${characterName}, anime artwork, anime gallery, Anime Orbit`}
        image={currentImage || "https://animeorbit.web.app/animeorbit.jpg"}
        url={`https://animeorbit.web.app/gallery/${id}`}
      />
      {/* Fixed Floating Back Button */}
      <button
        onClick={handleBack}
        className="fixed top-24 left-6 z-50 flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black px-5 py-2.5 rounded-full font-montserrat font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:scale-105 transition-all cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span>Back to Anime</span>
      </button>

      {/* Header Bar below Nav */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10 max-w-6xl mx-auto w-full pl-36 sm:pl-44">
        <h1 className="text-xl sm:text-2xl font-black font-staatliches uppercase tracking-wide text-white truncate max-w-md">
          {characterName} Gallery
        </h1>

        <span className="text-xs font-bold text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/30 px-3.5 py-1.5 rounded-full">
          {optimizedPictures.length > 0
            ? `${index + 1} / ${optimizedPictures.length}`
            : "0 Images"}
        </span>
      </div>

      {/* Main Showcase Stage */}
      <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full py-8">
        {optimizedPictures.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 w-12 h-12 rounded-full bg-black/60 border border-[#ffd700]/40 text-[#ffd700] flex items-center justify-center hover:scale-110 transition-all shadow-xl"
          >
            <ChevronLeft size={30} />
          </button>
        )}

        <div className="relative max-h-[65vh] rounded-2xl overflow-hidden border-2 border-[#ffd700]/40 shadow-2xl bg-neutral-900 flex items-center justify-center p-2">
          {currentImage ? (
            <img
              src={currentImage}
              alt={characterName}
              className="max-h-[60vh] max-w-full object-contain rounded-xl"
            />
          ) : (
            <div className="p-20 text-center text-neutral-500">
              <ImageIcon size={48} className="mx-auto text-neutral-600 mb-2" />
              <p className="text-sm">Loading artwork...</p>
            </div>
          )}
        </div>

        {optimizedPictures.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 w-12 h-12 rounded-full bg-black/60 border border-[#ffd700]/40 text-[#ffd700] flex items-center justify-center hover:scale-110 transition-all shadow-xl"
          >
            <ChevronRight size={30} />
          </button>
        )}
      </div>

      {/* Thumbnails Row */}
      {optimizedPictures.length > 1 && (
        <div className="flex gap-3 overflow-x-auto max-w-5xl mx-auto w-full py-4 justify-center">
          {optimizedPictures.map((pic, idx) => {
            const thumb = pic?.jpg?.image_url || pic?.image;
            return (
              <img
                key={idx}
                src={thumb}
                alt="Thumbnail"
                onClick={() => setIndex(idx)}
                className={`w-16 h-20 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                  index === idx
                    ? "border-[#ffd700] scale-105 shadow-lg shadow-[#ffd700]/30"
                    : "border-white/20 opacity-60 hover:opacity-100"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Gallery;
