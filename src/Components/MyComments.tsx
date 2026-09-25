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
import { AlertCircle, BookOpen, MessageSquare, Trash2, LogIn, ExternalLink, RefreshCw, Tv } from "lucide-react";
import { toast } from "react-toastify";
import AuthModal from "./AuthModal";
import ProgressiveImage from "./ProgressiveImage";
import Footer from "./Footer";

const commentMedia = (comment: any) => {
  const isManga = comment.mediaType === "MANGA" || Boolean(comment.mangaId);
  const mediaId = String((isManga ? comment.mangaId : comment.animeId) || comment.mediaId || "");
  return {
    isManga,
    id: mediaId,
    title: comment.mangaTitle || comment.animeTitle || comment.title || (isManga ? "Manga details" : "Anime details"),
    image: comment.mangaImage || comment.animeImage || "",
    route: isManga ? `/manga/${mediaId}` : `/anime/${mediaId}`,
  };
};

export const MyComments: React.FC = () => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError("");
      const q = query(collection(db, "comments"), where("userId", "==", currentUser.uid));

      const applySnapshot = (snapshot: any) => {
        const fetched = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          const left = a.createdAt?.toMillis?.() || a.createdAt?.toDate?.()?.getTime?.() || 0;
          const right = b.createdAt?.toMillis?.() || b.createdAt?.toDate?.()?.getTime?.() || 0;
          return right - left;
        });
        setComments(fetched);
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
            setLoadError("Your saved comments could not be loaded. Check your connection and try again.");
            setLoading(false);
          }
        }
      );

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, [currentUser, reloadKey]);

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, "comments", commentId));
      toast.info("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const animeComments = comments.filter((comment) => !commentMedia(comment).isManga);
  const mangaComments = comments.filter((comment) => commentMedia(comment).isManga);

  const renderSection = (mediaType: "anime" | "manga", entries: any[]) => (
    <section className="community-history-section">
      <header>
        <div>{mediaType === "manga" ? <BookOpen size={21} /> : <Tv size={21} />}<div><span>{mediaType} activity</span><h2>{mediaType === "manga" ? "Manga comments" : "Anime comments"}</h2></div></div>
        <b>{entries.length}</b>
      </header>
      {entries.length ? <div className="space-y-4">
        {entries.map((comm) => {
          const media = commentMedia(comm);
          return <article key={comm.id} className="p-5 bg-neutral-900/60 border border-white/10 hover:border-[#ffd700]/30 rounded-2xl flex flex-col sm:flex-row gap-5 items-start justify-between transition-all">
            <div className="flex gap-4 items-start flex-1 min-w-0">
              {media.image && <ProgressiveImage src={media.image} alt={`${media.title} cover`} wrapperClassName="w-16 h-24 rounded-xl border border-white/10 flex-shrink-0" className="h-full w-full object-cover" />}
              <div className="space-y-2 flex-1 min-w-0">
                <Link to={media.route} className="font-montserrat font-bold text-base text-white hover:text-[#ffd700] transition-colors inline-flex items-center gap-1">
                  <span>{media.title}</span><ExternalLink size={14} />
                </Link>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">{comm.text || comm.content}</p>
                <p className="text-[11px] text-neutral-500">Posted on: {comm.createdAt?.toDate ? comm.createdAt.toDate().toLocaleDateString() : "Recently"}</p>
              </div>
            </div>
            <button onClick={() => handleDeleteComment(comm.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors self-end sm:self-start flex-shrink-0">
              <Trash2 size={15} /><span>Delete</span>
            </button>
          </article>;
        })}
      </div> : <p className="community-history-section__empty">No {mediaType} comments yet.</p>}
    </section>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col"><main className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 flex-1">
        <SEO
          title="My Comments - Anime Community Discussions"
          description="View and manage your anime and manga community comments on Anime Orbit."
          keywords="my anime comments, manga comments, community discussions, Anime Orbit"
          url="https://animeorbit.web.app/my-comments"
          noIndex
        />
        <MessageSquare size={56} className="mx-auto text-[#ffd700]" />
        <h2 className="text-3xl font-bold font-montserrat text-white">
          My Comments
        </h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto">
          Sign in to view and manage your anime and manga discussions.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-bold px-6 py-2.5 rounded-full text-sm font-montserrat shadow-lg hover:scale-105 transition-all cursor-pointer"
        >
          <LogIn size={16} />
          <span>Sign In to Access Comments</span>
        </button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </main><Footer /></div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col"><main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12 space-y-6 sm:space-y-8 w-full flex-1">
      <SEO
        title="My Comments - Anime Community Discussions"
        description="View and manage your anime and manga community comments on Anime Orbit."
        keywords="my anime comments, manga comments, community discussions, Anime Orbit"
        url="https://animeorbit.web.app/my-comments"
        noIndex
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <MessageSquare size={30} className="text-[#ffd700]" />
          <h1 className="text-2xl sm:text-3xl font-bold font-montserrat text-white">
            My Comments
          </h1>
          <span className="text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">{comments.length} {comments.length === 1 ? "Comment" : "Comments"}</span>
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
          <span>Loading comments...</span>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-8">{renderSection("anime", animeComments)}{renderSection("manga", mangaComments)}</div>
      ) : (
        <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/5 space-y-2">
          <p className="font-montserrat font-bold text-lg text-white">
            You haven't posted any comments yet
          </p>
          <p className="text-xs text-neutral-400">
            Join the conversation on any anime or manga details page!
          </p>
        </div>
      )}
    </main><Footer /></div>
  );
};

export default MyComments;
