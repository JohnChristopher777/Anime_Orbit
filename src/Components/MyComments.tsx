import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SEO from "./SEO";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { MessageSquare, Trash2, LogIn, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import AuthModal from "./AuthModal";

export const MyComments: React.FC = () => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "comments"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setComments(fetched);
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, [currentUser]);

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, "comments", commentId));
      toast.info("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <SEO
          title="My Comments - Anime Community Discussions"
          description="View, monitor, and manage all your discussions and comments across anime titles on Anime Orbit."
          keywords="my anime comments, anime discussions, Anime Orbit"
          url="https://animeorbit.web.app/my-comments"
        />
        <MessageSquare size={56} className="mx-auto text-[#ffd700]" />
        <h2 className="text-3xl font-extrabold font-montserrat text-white">
          My Comments
        </h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto">
          Sign in to view, monitor, and manage all your discussions and comments across anime titles.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-extrabold px-6 py-2.5 rounded-full text-sm font-montserrat shadow-lg hover:scale-105 transition-all cursor-pointer"
        >
          <LogIn size={16} />
          <span>Sign In to Access Comments</span>
        </button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <SEO
        title="My Comments - Anime Community Discussions"
        description="View, monitor, and manage all your discussions and comments across anime titles on Anime Orbit."
        keywords="my anime comments, anime discussions, Anime Orbit"
        url="https://animeorbit.web.app/my-comments"
      />
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <MessageSquare size={30} className="text-[#ffd700]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold font-montserrat text-white">
            My Comments ({comments.length})
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#ffd700] font-montserrat font-bold flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin" />
          <span>Loading comments...</span>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comm) => (
            <div
              key={comm.id}
              className="p-5 bg-neutral-900/60 border border-white/10 hover:border-[#ffd700]/30 rounded-2xl flex flex-col sm:flex-row gap-5 items-start justify-between transition-all"
            >
              <div className="flex gap-4 items-start flex-1 min-w-0">
                {comm.animeImage && (
                  <img
                    src={comm.animeImage}
                    alt={comm.animeTitle}
                    className="w-16 h-24 object-cover rounded-xl border border-white/10 flex-shrink-0"
                  />
                )}
                <div className="space-y-2 flex-1 min-w-0">
                  <Link
                    to={`/anime/${comm.animeId}`}
                    className="font-montserrat font-bold text-base text-white hover:text-[#ffd700] transition-colors inline-flex items-center gap-1"
                  >
                    <span>{comm.animeTitle || "Anime Details"}</span>
                    <ExternalLink size={14} />
                  </Link>

                  <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                    {comm.text}
                  </p>

                  <p className="text-[11px] text-neutral-500">
                    Posted on: {comm.createdAt?.toDate ? comm.createdAt.toDate().toLocaleDateString() : "Recently"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDeleteComment(comm.id)}
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
            You haven't posted any comments yet
          </p>
          <p className="text-xs text-neutral-400">
            Join the conversation on any anime details page!
          </p>
        </div>
      )}
    </div>
  );
};

export default MyComments;
