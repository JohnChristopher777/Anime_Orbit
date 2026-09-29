import React from "react";
import { Link } from "react-router-dom";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  deleteDoc,
} from "firebase/firestore";
import { AlertTriangle, ChevronRight, Eye, EyeOff, Flag, MessageCircle, Reply, Send, Star, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useProfileIdentity } from "../hooks/useProfileIdentity";
import { checkRateLimit, sanitizeInput } from "../utils/security";
import AuthModal from "./AuthModal";
import ScoreSlider from "./ScoreSlider";
import { resolveCommunityIdentity, usePublicCommunityIdentities } from "../hooks/usePublicCommunityIdentities";
import { deleteCommunityEntryTree } from "../services/communityModeration";

interface MangaCommunityProps {
  mangaId: string;
  title: string;
  image: string;
}

const dateLabel = (value: any, edited?: any) => {
  const stamp = edited?.toDate?.() || value?.toDate?.();
  if (!stamp) return "Recently";
  return `${edited ? "Edited " : ""}${stamp.toLocaleDateString()}`;
};

const highlightedCommentText = (value: unknown, names: string[] = []) => {
  const escapedNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))]
    .sort((left, right) => right.length - left.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const matcher = new RegExp(`(@(?:${escapedNames.length ? `${escapedNames.join("|")}|` : ""}[A-Za-z0-9_.-]+))`, "g");
  return String(value || "").split(matcher).map((part, index) =>
    part.startsWith("@")
      ? <mark className="comment-mention" key={`${part}-${index}`}>{part}</mark>
      : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>,
  );
};

const ProfileAvatar: React.FC<{ entry: any; size?: "small" | "normal" }> = ({ entry, size = "normal" }) => (
  <Link
    to={`/user/${encodeURIComponent(entry.profileHandle || entry.userId)}`}
    className={`manga-community__avatar ${size === "small" ? "is-small" : ""}`}
    aria-label={`View ${entry.userName}'s profile`}
  >
    <span>{entry.userName?.[0]?.toUpperCase() || "A"}</span>
    {entry.userAvatar && <img src={entry.userAvatar} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
  </Link>
);

const MangaCommunity: React.FC<MangaCommunityProps> = ({ mangaId, title, image }) => {
  const { currentUser } = useAuth();
  const identity = useProfileIdentity();
  const [activeTab, setActiveTab] = React.useState<"discussion" | "reviews">(() => new URLSearchParams(window.location.search).get("tab") === "reviews" ? "reviews" : "discussion");
  const [comments, setComments] = React.useState<any[]>([]);
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loadingComments, setLoadingComments] = React.useState(true);
  const [loadingReviews, setLoadingReviews] = React.useState(true);
  const [readLatest, setReadLatest] = React.useState(() => localStorage.getItem(`anime_orbit_manga_latest_${mangaId}`) === "true");
  const [revealed, setRevealed] = React.useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = React.useState("");
  const [postingComment, setPostingComment] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [postingReply, setPostingReply] = React.useState(false);
  const [expandedReplies, setExpandedReplies] = React.useState<Record<string, boolean>>({});
  const [reviewText, setReviewText] = React.useState("");
  const [reviewScore, setReviewScore] = React.useState(10);
  const [savingReview, setSavingReview] = React.useState(false);
  const [reviewEditorOpen, setReviewEditorOpen] = React.useState(false);
  const [authOpen, setAuthOpen] = React.useState(false);
  const loadedReviewDraft = React.useRef("");
  const publicCommunityIdentities = usePublicCommunityIdentities([...comments, ...reviews]);
  const mentionNames = React.useMemo(
    () => Object.values(publicCommunityIdentities as Record<string, any>).flatMap((entry: any) => [entry?.displayName, entry?.profileHandle]).filter(Boolean),
    [publicCommunityIdentities],
  );
  const displayEntry = (entry: any) => {
    const live = resolveCommunityIdentity(entry, publicCommunityIdentities);
    return { ...entry, userName: live.displayName, userAvatar: live.avatarUrl, profileHandle: live.profileHandle };
  };

  const currentReview = React.useMemo(
    () => currentUser ? reviews.find((review) => review.userId === currentUser.uid) : null,
    [currentUser, reviews],
  );

  React.useEffect(() => {
    localStorage.setItem(`anime_orbit_manga_latest_${mangaId}`, String(readLatest));
    if (readLatest) setRevealed({});
  }, [mangaId, readLatest]);

  React.useEffect(() => {
    const numericId = Number(mangaId);
    const ids = Number.isFinite(numericId) ? [mangaId, numericId] : [mangaId];
    const commentsQuery = query(collection(db, "comments"), where("mangaId", "in", ids));
    const reviewsQuery = query(collection(db, "reviews"), where("mangaId", "in", ids));
    const order = (snapshot: any) => snapshot.docs
      .map((entry: any) => ({ id: entry.id, ...entry.data() }))
      .sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      setComments(order(snapshot));
      setLoadingComments(false);
    }, async () => {
      try { setComments(order(await getDocs(commentsQuery))); } catch { setComments([]); }
      setLoadingComments(false);
    });
    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const seen = new Set<string>();
      setReviews(order(snapshot).filter((review: any) => {
        const reviewer = String(review.userId || review.id);
        if (seen.has(reviewer)) return false;
        seen.add(reviewer);
        return true;
      }));
      setLoadingReviews(false);
    }, async () => {
      try {
        const seen = new Set<string>();
        setReviews(order(await getDocs(reviewsQuery)).filter((review: any) => {
          const reviewer = String(review.userId || review.id);
          if (seen.has(reviewer)) return false;
          seen.add(reviewer);
          return true;
        }));
      } catch { setReviews([]); }
      setLoadingReviews(false);
    });
    return () => { unsubscribeComments(); unsubscribeReviews(); };
  }, [mangaId]);

  React.useEffect(() => {
    if (!currentReview) {
      loadedReviewDraft.current = "";
      return;
    }
    if (loadedReviewDraft.current === currentReview.id) return;
    loadedReviewDraft.current = currentReview.id;
    setReviewText(currentReview.text || currentReview.content || "");
    setReviewScore(Number(currentReview.rating || 10));
  }, [currentReview]);

  React.useEffect(() => {
    const requestedReview = new URLSearchParams(window.location.search).get("editReview");
    if (currentReview && requestedReview && (requestedReview === "mine" || requestedReview === currentReview.id)) setReviewEditorOpen(true);
  }, [currentReview]);

  React.useEffect(() => {
    if (loadingComments || activeTab !== "discussion" || !window.location.hash) return;
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    const targetCommentId = targetId.replace(/^comment-/, "");
    const targetReply = comments.find((entry) => entry.id === targetCommentId && entry.parentId);
    if (targetReply?.parentId) setExpandedReplies((current) => ({ ...current, [targetReply.parentId]: true }));
    const timer = window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 140);
    return () => window.clearTimeout(timer);
  }, [loadingComments, activeTab, comments.length]);

  React.useEffect(() => {
    if (loadingReviews || activeTab !== "reviews" || !window.location.hash) return;
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    if (!targetId.startsWith("review-")) return;
    const timer = window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 140);
    return () => window.clearTimeout(timer);
  }, [loadingReviews, activeTab, reviews.length]);

  const commonIdentity = {
    userId: currentUser?.uid,
    userName: identity.displayName,
    userAvatar: identity.avatarUrl,
    profileHandle: identity.profileHandle,
  };

  const publishComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return setAuthOpen(true);
    const clean = sanitizeInput(commentText, 2000);
    if (!clean) return;
    if (!checkRateLimit(`manga_comment_${currentUser.uid}`, 3000)) return toast.warning("Please wait a moment before posting again.");
    setPostingComment(true);
    try {
      await addDoc(collection(db, "comments"), {
        mangaId,
        mediaType: "MANGA",
        ...commonIdentity,
        text: clean,
        content: clean,
        mangaTitle: title,
        mangaImage: image,
        likes: [],
        dislikes: [],
        reports: [],
        createdAt: serverTimestamp(),
      });
      setCommentText("");
      toast.success("Comment posted.");
    } catch { toast.error("The comment could not be posted."); }
    finally { setPostingComment(false); }
  };

  const notify = (recipientId: string, notificationId: string | null, payload: Record<string, unknown>) => {
    if (!currentUser || recipientId === currentUser.uid) return;
    const reference = notificationId
      ? doc(db, "users", recipientId, "notifications", notificationId)
      : doc(collection(db, "users", recipientId, "notifications"));
    void setDoc(reference, {
      mediaType: "MANGA",
      recipientId,
      actorId: currentUser.uid,
      actorName: identity.displayName,
      actorAvatar: identity.avatarUrl,
      animeId: mangaId,
      animeTitle: title,
      read: false,
      createdAt: serverTimestamp(),
      ...payload,
    }, { merge: Boolean(notificationId) }).catch(() => {});
  };

  const reactToComment = async (comment: any, reaction: "like" | "dislike" | "report") => {
    if (!currentUser) return setAuthOpen(true);
    const liked = (comment.likes || []).includes(currentUser.uid);
    const disliked = (comment.dislikes || []).includes(currentUser.uid);
    try {
      if (reaction === "like") {
        await updateDoc(doc(db, "comments", comment.id), {
          likes: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
          dislikes: arrayRemove(currentUser.uid),
        });
        if (!liked) notify(comment.userId, `like-${comment.id}-${currentUser.uid}`, {
          type: "like",
          commentId: comment.id,
          parentId: comment.parentId || comment.id,
          preview: sanitizeInput(comment.text || comment.content || "", 240),
        });
      } else if (reaction === "dislike") {
        const nextCount = disliked ? Math.max(0, (comment.dislikes || []).length - 1) : (comment.dislikes || []).length + 1;
        await updateDoc(doc(db, "comments", comment.id), {
          dislikes: disliked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
          likes: arrayRemove(currentUser.uid),
        });
        if (!disliked && nextCount >= 10) notify(comment.userId, `controversial-${comment.id}`, {
          type: "controversial",
          actorName: "Anime Orbit",
          actorAvatar: "/icon.png",
          commentId: comment.id,
          parentId: comment.parentId || comment.id,
          sourceCommentId: comment.id,
          preview: sanitizeInput(comment.text || comment.content || "", 240),
        });
      } else {
        await updateDoc(doc(db, "comments", comment.id), { reports: arrayUnion(currentUser.uid) });
        toast.info("Report received.");
      }
    } catch { toast.error("The reaction could not be saved."); }
  };

  const publishReply = async (parent: any) => {
    if (!currentUser) return setAuthOpen(true);
    const clean = sanitizeInput(replyText, 1200);
    if (!clean) return;
    setPostingReply(true);
    try {
      const replyReference = await addDoc(collection(db, "comments"), {
        mangaId,
        mediaType: "MANGA",
        parentId: parent.parentId || parent.id,
        ...commonIdentity,
        text: clean,
        content: clean,
        mangaTitle: title,
        mangaImage: image,
        likes: [],
        dislikes: [],
        reports: [],
        createdAt: serverTimestamp(),
      });
      notify(parent.userId, null, {
        type: "reply",
        commentId: replyReference.id,
        parentId: parent.parentId || parent.id,
        sourceCommentId: parent.id,
        preview: clean.slice(0, 240),
      });
      setReplyText("");
      setReplyingTo(null);
    } catch { toast.error("The reply could not be posted."); }
    finally { setPostingReply(false); }
  };

  const saveReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return setAuthOpen(true);
    const clean = sanitizeInput(reviewText, 3000);
    if (!clean) return;
    setSavingReview(true);
    try {
      if (currentReview) {
        await updateDoc(doc(db, "reviews", currentReview.id), { text: clean, content: clean, rating: Number(reviewScore), updatedAt: serverTimestamp() });
        toast.success("Your review was updated.");
      } else {
        const reviewId = `MANGA_${mangaId}_${currentUser.uid}`;
        await setDoc(doc(db, "reviews", reviewId), {
          mangaId,
          mediaType: "MANGA",
          ...commonIdentity,
          rating: Number(reviewScore),
          text: clean,
          content: clean,
          mangaTitle: title,
          mangaImage: image,
          createdAt: serverTimestamp(),
        });
        loadedReviewDraft.current = reviewId;
        toast.success("Review published.");
      }
      setReviewEditorOpen(false);
    } catch { toast.error("Your review could not be saved."); }
    finally { setSavingReview(false); }
  };

  const deleteReview = async (reviewId: string) => {
    if (!currentUser || !window.confirm("Delete this review permanently?")) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      loadedReviewDraft.current = "";
      setReviewText("");
      setReviewScore(0);
      setReviewEditorOpen(false);
      toast.info("Review deleted");
    } catch { toast.error("The review could not be deleted."); }
  };

  const deleteComment = async (entry: any) => {
    if (!currentUser) return;
    const root = !entry.parentId;
    if (!window.confirm(root ? "Delete this comment, every reply below it, and its notifications?" : "Delete this reply?")) return;
    try {
      await deleteCommunityEntryTree(entry, currentUser.uid);
      toast.info(root ? "Comment thread deleted" : "Reply deleted");
    } catch { toast.error("The comment could not be deleted."); }
  };

  const renderBody = (comment: any) => {
    const hidden = !readLatest && !revealed[comment.id];
    if (!hidden) return <div className="manga-community__comment-text"><p>{highlightedCommentText(comment.text || comment.content, mentionNames)}</p>{!readLatest && <button type="button" className="comment-hide-spoiler" onClick={() => setRevealed((value) => ({ ...value, [comment.id]: false }))}><EyeOff size={13} />Hide again</button>}</div>;
    return <button type="button" className="manga-community__spoiler" onClick={() => setRevealed((value) => ({ ...value, [comment.id]: true }))}><p>{highlightedCommentText(comment.text || comment.content, mentionNames)}</p><span><Eye size={17} />Touch to reveal this manga discussion</span></button>;
  };

  const rootComments = comments.filter((comment) => !comment.parentId);

  return (
    <section className="manga-community" aria-labelledby="manga-community-title">
      <header className="manga-community__header">
        <div><span><MessageCircle size={14} />Reader community</span><h2 id="manga-community-title">Discussion & reviews</h2><p>Talk about this manga with spoiler controls matched to your reading progress.</p></div>
        <label className="manga-community__latest"><input type="checkbox" checked={readLatest} onChange={(event) => setReadLatest(event.target.checked)} /><i /><span><strong>I read through the latest chapter</strong><small>{readLatest ? "All discussion is shown normally." : "Discussion stays blurred until you touch it."}</small></span></label>
      </header>

      <nav className="manga-community__tabs" aria-label="Manga community sections">
        <button type="button" className={activeTab === "discussion" ? "is-active" : ""} onClick={() => setActiveTab("discussion")}>Discussion <b>{comments.length}</b></button>
        <button type="button" className={activeTab === "reviews" ? "is-active" : ""} onClick={() => setActiveTab("reviews")}>Reviews <b>{reviews.length}</b></button>
      </nav>

      {activeTab === "discussion" ? <div className="manga-community__panel">
        {currentUser ? <form className="manga-community__composer" onSubmit={publishComment}><textarea value={commentText} maxLength={2000} onChange={(event) => setCommentText(event.target.value)} placeholder="Share a thought about the manga. Readers who are not caught up will see it blurred." /><div><span><AlertTriangle size={14} />Manga discussion is spoiler-protected for readers who are not caught up.</span><button disabled={postingComment || !commentText.trim()}>{postingComment ? "Posting..." : "Post comment"}</button></div></form> : <button type="button" className="manga-community__signin" onClick={() => setAuthOpen(true)}>Sign in to join this manga discussion</button>}
        <div className="manga-community__comments">
          {loadingComments ? <p className="manga-community__empty">Loading discussion...</p> : rootComments.length ? rootComments.map((comment) => {
            const visibleComment = displayEntry(comment);
            const replies = comments.filter((entry) => entry.parentId === comment.id);
            const liked = Boolean(currentUser && (comment.likes || []).includes(currentUser.uid));
            const disliked = Boolean(currentUser && (comment.dislikes || []).includes(currentUser.uid));
            return <article id={`comment-${comment.id}`} key={comment.id} className="manga-community__comment"><ProfileAvatar entry={visibleComment} /><div className="manga-community__comment-main"><header><div><Link to={`/user/${encodeURIComponent(visibleComment.profileHandle || visibleComment.userId)}`}>{visibleComment.userName}</Link><span>Reader</span></div><time>{dateLabel(comment.createdAt)}</time></header>{renderBody(comment)}<div className="manga-community__actions"><button type="button" className={liked ? "is-liked" : ""} onClick={() => void reactToComment(comment, "like")}><ThumbsUp size={14} />{comment.likes?.length || 0}</button><button type="button" className={disliked ? "is-disliked" : ""} onClick={() => void reactToComment(comment, "dislike")}><ThumbsDown size={14} />{comment.dislikes?.length || 0}</button><button type="button" onClick={() => { if (!currentUser) return setAuthOpen(true); setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(`@${visibleComment.userName} `); }}><Reply size={14} />Reply</button><button type="button" onClick={() => void reactToComment(comment, "report")}><Flag size={13} />Report</button>{currentUser?.uid === comment.userId && <button type="button" className="comment-delete-action" onClick={() => void deleteComment(comment)}><Trash2 size={12} />Delete thread</button>}</div>
            {replyingTo === comment.id && <div className="manga-community__reply-box"><input autoFocus value={replyText} maxLength={1200} onChange={(event) => setReplyText(event.target.value)} placeholder={`Reply to ${visibleComment.userName}`} /><button type="button" disabled={postingReply || !replyText.trim()} onClick={() => void publishReply(comment)}><Send size={15} /></button></div>}
            {replies.length > 0 && <button type="button" className="comment-replies-toggle" aria-expanded={Boolean(expandedReplies[comment.id])} onClick={() => setExpandedReplies((current) => ({ ...current, [comment.id]: !current[comment.id] }))}><MessageCircle size={13} />{expandedReplies[comment.id] ? "Hide" : "View"} {replies.length} {replies.length === 1 ? "reply" : "replies"}<ChevronRight size={13} className={expandedReplies[comment.id] ? "rotate-90" : ""} /></button>}
            {replies.length > 0 && expandedReplies[comment.id] && <div className="manga-community__replies">{replies.map((reply) => { const visibleReply = displayEntry(reply); return <article id={`comment-${reply.id}`} key={reply.id}><ProfileAvatar entry={visibleReply} size="small" /><div><header><Link to={`/user/${encodeURIComponent(visibleReply.profileHandle || visibleReply.userId)}`}>{visibleReply.userName}</Link><time>{dateLabel(reply.createdAt)}</time></header>{renderBody(reply)}<div className="manga-community__actions"><button type="button" onClick={() => void reactToComment(reply, "like")}><ThumbsUp size={12} />{reply.likes?.length || 0}</button><button type="button" onClick={() => { setReplyingTo(comment.id); setReplyText(`@${visibleReply.userName} `); }}><Reply size={12} />Reply</button>{currentUser?.uid === reply.userId && <button type="button" className="comment-delete-action is-small" onClick={() => void deleteComment(reply)}><Trash2 size={11} />Delete</button>}</div></div></article>; })}</div>}
            </div></article>;
          }) : <p className="manga-community__empty">No comments yet. Start the reader discussion.</p>}
        </div>
      </div> : <div className="manga-community__panel">
        {currentUser ? currentReview && !reviewEditorOpen ? <div className="review-edit-window"><div><strong>Your review is published</strong><span>Open the editor when you want to update or remove it.</span></div><button type="button" className="review-edit-action" onClick={() => setReviewEditorOpen(true)}>Edit review</button></div> : <form className="manga-community__review-form" onSubmit={saveReview}><div><span>{currentReview ? "Edit your review" : "Your review"}</span><h3>One review per reader</h3><p>{currentReview ? "Saving updates your existing review. Delete is available only while editing." : "You can return and edit this review later."}</p></div><ScoreSlider id="manga-review-score" label="Manga score" value={reviewScore} onChange={setReviewScore} disabled={savingReview} /><textarea id="manga-review-textarea" value={reviewText} maxLength={3000} onChange={(event) => setReviewText(event.target.value)} placeholder="Write your manga review..." /><div className="review-editor-actions"><button disabled={savingReview || !reviewText.trim()}>{savingReview ? "Saving..." : currentReview ? "Save review" : "Publish review"}</button>{currentReview && <button type="button" className="review-delete-action" onClick={() => void deleteReview(currentReview.id)}><Trash2 size={13} />Delete review</button>}{currentReview && <button type="button" className="review-cancel-action" onClick={() => setReviewEditorOpen(false)}>Cancel</button>}</div></form> : <button type="button" className="manga-community__signin" onClick={() => setAuthOpen(true)}>Sign in to review this manga</button>}
        <div className="manga-community__reviews">{loadingReviews ? <p className="manga-community__empty">Loading reviews...</p> : reviews.length ? reviews.map((review) => { const visibleReview = displayEntry(review); return <article id={`review-${review.id}`} key={review.id}><ProfileAvatar entry={visibleReview} /><div><header><div><Link to={`/user/${encodeURIComponent(visibleReview.profileHandle || visibleReview.userId)}`}>{visibleReview.userName}</Link><time>{dateLabel(review.createdAt, review.updatedAt)}</time></div><b><Star size={13} fill="currentColor" />{Number(review.rating || 0).toFixed(2).replace(/\.00$/, ".0")}</b></header><p>{review.text || review.content}</p>{currentUser?.uid === review.userId && <button type="button" className="review-edit-action" onClick={() => { setReviewEditorOpen(true); window.setTimeout(() => document.getElementById("manga-review-textarea")?.scrollIntoView({ behavior: "smooth", block: "center" }), 40); }}>Edit review</button>}</div></article>; }) : <p className="manga-community__empty">No reviews yet. Be the first reader to review it.</p>}</div>
      </div>}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </section>
  );
};

export default MangaCommunity;
