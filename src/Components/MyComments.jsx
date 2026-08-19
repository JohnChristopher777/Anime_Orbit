import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase/config.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { MessageSquare, Trash2, LogIn, Film, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const MyComments = () => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const commentsRef = collection(db, "comments");
    const q = query(
      commentsRef,
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(fetchedComments);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user comments:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleDelete = async (commentId) => {
    try {
      await deleteDoc(doc(db, "comments", commentId));
      toast.success("Comment deleted successfully!");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!currentUser) {
    return (
      <Container>
        <EmptyState>
          <LogIn size={64} color="#ffd700" />
          <h2>Sign in to view your comments</h2>
          <p>Your anime discussions will appear here once you sign in.</p>
        </EmptyState>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Header>
          <MessageSquare size={32} color="#ffd700" />
          <h1>My Comments</h1>
        </Header>
        <CommentsList>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <Skeleton
                width={80}
                height={110}
                borderRadius={8}
                baseColor="#2c2c2c"
                highlightColor="#3a3a3a"
              />
              <div style={{ flex: 1 }}>
                <Skeleton
                  width="60%"
                  height={22}
                  baseColor="#2c2c2c"
                  highlightColor="#3a3a3a"
                />
                <Skeleton
                  count={2}
                  baseColor="#2c2c2c"
                  highlightColor="#3a3a3a"
                  style={{ marginTop: "0.5rem" }}
                />
              </div>
            </SkeletonCard>
          ))}
        </CommentsList>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <MessageSquare size={32} color="#ffd700" />
        <h1>My Comments</h1>
        <CommentCount>{comments.length} comments</CommentCount>
      </Header>

      <AnimatePresence mode="popLayout">
        {comments.length > 0 ? (
          <CommentsList>
            {comments.map((comment, index) => (
              <CommentCard
                key={comment.id}
                as={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
              >
                <AnimeImageWrapper>
                  {comment.animeImage ? (
                    <Link to={`/anime/${comment.animeId}`}>
                      <img
                        src={comment.animeImage}
                        alt={comment.animeTitle || "Anime"}
                      />
                    </Link>
                  ) : (
                    <PlaceholderImage>
                      <Film size={28} color="rgba(255,215,0,0.4)" />
                    </PlaceholderImage>
                  )}
                </AnimeImageWrapper>

                <CommentContent>
                  <CommentHeader>
                    <Link
                      to={`/anime/${comment.animeId}`}
                      className="anime-title"
                    >
                      {comment.animeTitle || `Anime #${comment.animeId}`}
                    </Link>
                  </CommentHeader>

                  <CommentText>{comment.text}</CommentText>

                  <CommentFooter>
                    <CommentDate>{formatDate(comment.createdAt)}</CommentDate>
                    <ActionGroup>
                      <ViewAnimeLink to={`/anime/${comment.animeId}`}>
                        <span>View Discussion</span>
                        <ArrowRight size={14} />
                      </ViewAnimeLink>
                      <DeleteButton onClick={() => handleDelete(comment.id)}>
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </DeleteButton>
                    </ActionGroup>
                  </CommentFooter>
                </CommentContent>
              </CommentCard>
            ))}
          </CommentsList>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <EmptyState>
              <MessageSquare size={64} color="#ffd700" />
              <h2>No comments yet</h2>
              <p>
                Visit any anime page and share your thoughts in the discussion
                tab!
              </p>
            </EmptyState>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 80vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);
  padding-bottom: 1.5rem;
  flex-wrap: wrap;

  h1 {
    font-family: "Staatliches", cursive;
    font-size: 2.8rem;
    color: #ffd700;
    margin: 0;
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
    letter-spacing: 0.05em;
  }
`;

const CommentCount = styled.span`
  font-family: "Montserrat", sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 215, 0, 0.1);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  margin-left: auto;
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const CommentCard = styled.div`
  display: flex;
  gap: 1.5rem;
  background: linear-gradient(
    145deg,
    rgba(40, 40, 40, 0.8),
    rgba(25, 25, 25, 0.9)
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.3rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
  }

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const AnimeImageWrapper = styled.div`
  flex-shrink: 0;
  width: 80px;
  height: 110px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid rgba(255, 215, 0, 0.2);
  background: #1a1a1a;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  a:hover img {
    transform: scale(1.05);
  }

  @media (max-width: 600px) {
    width: 100%;
    height: 140px;
  }
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
`;

const CommentContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  .anime-title {
    font-family: "Montserrat", sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #ffd700;
    }
  }
`;

const CommentText = styled.p`
  font-family: "Inter", "Noto Sans JP", sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
`;

const CommentFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const CommentDate = styled.span`
  font-family: "Inter", sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ViewAnimeLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: "Montserrat", sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: #ffd700;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: #ffea00;
    transform: translateX(2px);
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(255, 77, 77, 0.08);
  border: 1px solid rgba(255, 77, 77, 0.2);
  color: #ff6b6b;
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  font-family: "Montserrat", sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #ff4d4d;
    color: white;
    border-color: #ff4d4d;
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);

  h2 {
    font-family: "Montserrat", sans-serif;
    color: white;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
  }
`;

const SkeletonCard = styled.div`
  display: flex;
  gap: 1.5rem;
  background: rgba(40, 40, 40, 0.5);
  border-radius: 16px;
  padding: 1.3rem;
`;

export default MyComments;
