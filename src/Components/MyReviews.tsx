import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SEO from "./SEO";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { AlertCircle, MessageCircle, Star, Trash2, LogIn, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import AuthModal from "./AuthModal";
import ProgressiveImage from "./ProgressiveImage";
import Footer from "./Footer";

export const MyReviews: React.FC = () => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError("");
      const q = query(collection(db, "reviews"), where("userId", "==", currentUser.uid));

      const applySnapshot = (snapshot: any) => {
        const fetched = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          const left = a.createdAt?.toMillis?.() || a.createdAt?.toDate?.()?.getTime?.() || 0;
          const right = b.createdAt?.toMillis?.() || b.createdAt?.toDate?.()?.getTime?.() || 0;
          return right - left;
        });
        setReviews(fetched);
        setLoadError("");
        setLoading(false);
      };

      const unsubscribe = onSnapshot(
        q,
        applySnapshot,
        async () => {
          try {
            applySnapshot(await getDocs(q));
          } catch {
            setLoadError("Your saved reviews could not be loaded. Check your connection and try again.");
            setLoading(false);
          }
        }
      );

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, [currentUser, reloadKey]);

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      toast.info("Review deleted");
    } catch {
      toast.error("Failed to delete review");
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col"><main className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 flex-1">
        <SEO
          title="My Anime Reviews - Community Ratings"
          description="View, edit, and manage all your written anime ratings and reviews across all genres on Anime Orbit."
          keywords="my anime reviews, anime ratings, Anime Orbit"
          url="https://animeorbit.web.app/my-reviews"
          noIndex
        />
        <MessageCircle size={56} className="mx-auto text-[#ffd700]" />
        <h2 className="text-3xl font-bold font-montserrat text-white">
          My Anime Reviews
        </h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto">
          Sign in to view, edit, and manage all your written anime ratings and reviews in one place.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-bold px-6 py-2.5 rounded-full text-sm font-montserrat shadow-lg hover:scale-105 transition-all cursor-pointer"
        >
          <LogIn size={16} />
          <span>Sign In to Access Reviews</span>
        </button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </main><Footer /></div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col"><main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12 space-y-6 sm:space-y-8 w-full flex-1">
      <SEO
        title="My Anime Reviews - Community Ratings"
        description="View, edit, and manage all your written anime ratings and reviews across all genres on Anime Orbit."
        keywords="my anime reviews, anime ratings, Anime Orbit"
        url="https://animeorbit.web.app/my-reviews"
        noIndex
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <MessageCircle size={30} className="text-[#ffd700]" />
          <h1 className="text-2xl sm:text-3xl font-bold font-montserrat text-white">
            My Reviews
          </h1>
          <span className="text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">{reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}</span>
        </div>
      </div>

      {loadError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-12 text-center">
          <AlertCircle size={24} className="text-[#ffd700]" />
          <p className="max-w-md text-sm text-neutral-300">{loadError}</p>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="inline-flex items-center gap-2 rounded-full bg-[#ffd700] px-4 py-2 text-xs font-bold text-black"><RefreshCw size={14} />Retry</button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-[#ffd700] font-montserrat font-bold flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin" />
          <span>Loading reviews...</span>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 bg-neutral-900/60 border border-white/10 hover:border-[#ffd700]/30 rounded-2xl flex flex-col sm:flex-row gap-5 items-start justify-between transition-all"
            >
              <div className="flex gap-4 items-start flex-1 min-w-0">
                {rev.animeImage && <ProgressiveImage src={rev.animeImage} alt={rev.animeTitle || "Anime cover"} wrapperClassName="w-16 h-24 rounded-xl border border-white/10 flex-shrink-0" className="h-full w-full object-cover" />}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      to={`/anime/${rev.animeId}`}
                      className="font-montserrat font-bold text-base text-white hover:text-[#ffd700] transition-colors flex items-center gap-1"
                    >
                      <span>{rev.animeTitle || "Anime Details"}</span>
                      <ExternalLink size={14} />
                    </Link>
                    <div className="flex items-center gap-1 bg-[#ffd700]/20 border border-[#ffd700]/40 text-[#ffd700] px-2.5 py-0.5 rounded-full text-xs font-bold font-montserrat">
                      <Star size={12} fill="#ffd700" />
                      <span>{rev.rating} / 10</span>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                    {rev.text || rev.content}
                  </p>

                  <p className="text-[11px] text-neutral-500">
                    Reviewed on: {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString() : "Recently"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDeleteReview(rev.id)}
                className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors self-end sm:self-start flex-shrink-0"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/5 space-y-2">
          <p className="font-montserrat font-bold text-lg text-white">
            You haven't written any reviews yet
          </p>
          <p className="text-xs text-neutral-400">
            Visit an anime details page and share your thoughts in the Reviews tab!
          </p>
        </div>
      )}
    </main><Footer /></div>
  );
};

export default MyReviews;
