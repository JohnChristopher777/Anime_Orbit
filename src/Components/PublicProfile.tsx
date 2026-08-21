import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import SEO from "./SEO";
import Footer from "./Footer";
import { User, Tag, Heart, List, CheckCircle, Clock, Sparkles, Share2, Copy, Check, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

interface PublicUserData {
  displayName: string;
  userId?: string;
  avatarUrl?: string;
  bio?: string;
  favoriteGenre?: string;
  createdAt?: string;
}

export const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<PublicUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        // Try looking up directly by document UID first
        const userDocRef = doc(db, "users", id);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const d = userDoc.data();
          // STRICT CYBER-DEFENSE & PRIVACY: Only extract safe public fields, NEVER age, birthDate, deletion status or email
          setUserData({
            displayName: d.displayName || "Anime Fan",
            userId: d.userId || id,
            avatarUrl: d.avatarUrl,
            bio: d.bio,
            favoriteGenre: d.favoriteGenre || "Action",
            createdAt: d.createdAt,
          });
        } else {
          // If not matching doc ID, query by userId field
          const q = query(collection(db, "users"), where("userId", "==", id));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const d = querySnap.docs[0].data();
            setUserData({
              displayName: d.displayName || "Anime Fan",
              userId: d.userId || id,
              avatarUrl: d.avatarUrl,
              bio: d.bio,
              favoriteGenre: d.favoriteGenre || "Action",
              createdAt: d.createdAt,
            });
          } else {
            setUserData(null);
          }
        }
      } catch (err) {
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Profile link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white font-sans flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-montserrat font-bold text-sm text-[#ffd700]">Loading profile...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4 flex-1">
          <User size={56} className="mx-auto text-neutral-600" />
          <h2 className="text-2xl font-bold font-montserrat text-white">User Not Found</h2>
          <p className="text-xs text-neutral-400">
            This anime profile does not exist or has been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#ffd700] text-black font-bold px-6 py-2 rounded-full text-xs font-montserrat shadow-md hover:scale-105 transition-all"
          >
            <ArrowLeft size={14} />
            <span>Return to Home</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title={`${userData.displayName} (@${userData.userId || "user"}) - Anime Orbit Profile`}
        description={`Explore ${userData.displayName}'s favorite anime, top genres, and watchlist on Anime Orbit.`}
        keywords="anime user profile, anime favorites, anime orbit"
        url={`https://animeorbit.web.app/user/${id}`}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 space-y-8 flex-1 w-full font-inter">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-[#ffd700] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Discovery</span>
        </Link>

        {/* Public Profile Card */}
        <div className="relative bg-[#15151c]/95 border border-[#ffd700]/30 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-10 backdrop-blur-xl space-y-6">
          {/* Top Gradient Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ffd700] via-[#ff9f43] to-[#ff4d4d]" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* Avatar Icon */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#ffd700] shadow-[0_0_25px_rgba(255,215,0,0.35)] bg-neutral-800 flex-shrink-0 flex items-center justify-center">
                {userData.avatarUrl ? (
                  <img
                    src={userData.avatarUrl}
                    alt={userData.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <User size={48} className="text-[#ffd700]" />
                )}
              </div>

              {/* User Identity (NEVER LEAKS EMAIL OR BIRTHDAY) */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black font-montserrat text-white truncate max-w-xs">
                    {userData.displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-[#ffd700]/15 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold font-montserrat px-2.5 py-0.5 rounded-full">
                    <Tag size={10} />
                    {userData.favoriteGenre}
                  </span>
                </div>

                {userData.userId && (
                  <p className="text-xs font-mono font-bold text-[#ffd700]/90">
                    @{userData.userId}
                  </p>
                )}

                {userData.bio ? (
                  <p className="text-xs sm:text-sm text-neutral-300 max-w-lg leading-relaxed pt-1">
                    "{userData.bio}"
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400 italic pt-1">
                    Anime fan exploring the cosmic universe.
                  </p>
                )}
              </div>
            </div>

            {/* Share Profile Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-xs px-5 py-2.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
              <span>{copied ? "Link Copied!" : "Share Profile"}</span>
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PublicProfile;
