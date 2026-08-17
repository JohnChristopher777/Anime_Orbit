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
import { MessageCircle, Star, Trash2, LogIn, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const MyReviews = () => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedReviews = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviews(fetchedReviews);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching reviews:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleDelete = async (reviewId) => {
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      toast.success("Review deleted successfully!");
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review.");
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
          <h2>Sign in to view your reviews</h2>
          <p>Your anime reviews will appear here once you sign in.</p>
        </EmptyState>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Header>
          <MessageCircle size={32} color="#ffd700" />
          <h1>My Reviews</h1>
        </Header>
        <ReviewsList>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <Skeleton
                width={90}
                height={130}
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
                  width="30%"
                  height={18}
                  baseColor="#2c2c2c"
                  highlightColor="#3a3a3a"
                  style={{ marginTop: "0.5rem" }}
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
        </ReviewsList>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <MessageCircle size={32} color="#ffd700" />
        <h1>My Reviews</h1>
        <ReviewCount>{reviews.length} reviews</ReviewCount>
      </Header>

      <AnimatePresence mode="popLayout">
        {reviews.length > 0 ? (
          <ReviewsList>
            {reviews.map((review, index) => (
              <ReviewCard
                key={review.id}
                as={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <AnimeImageWrapper>
                  {review.animeImage ? (
                    <Link to={`/anime/${review.animeId}`}>
                      <img src={review.animeImage} alt={review.animeTitle || "Anime"} />
                    </Link>
                  ) : (
                    <PlaceholderImage>
                      <Film size={32} color="rgba(255,215,0,0.4)" />
                    </PlaceholderImage>
                  )}
                </AnimeImageWrapper>

                <ReviewContent>
                  <ReviewHeader>
                    <Link to={`/anime/${review.animeId}`} className="anime-title">
                      {review.animeTitle || `Anime #${review.animeId}`}
                    </Link>
                    <RatingBadge>
                      <Star size={14} fill="#ffd700" color="#ffd700" />
                      <span>{review.rating}/10</span>
                    </RatingBadge>
                  </ReviewHeader>

                  <ReviewText>{review.text}</ReviewText>

                  <ReviewFooter>
                    <ReviewDate>{formatDate(review.createdAt)}</ReviewDate>
                    <DeleteButton onClick={() => handleDelete(review.id)}>
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </DeleteButton>
                  </ReviewFooter>
                </ReviewContent>
              </ReviewCard>
            ))}
          </ReviewsList>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <EmptyState>
              <MessageCircle size={64} color="#ffd700" />
              <h2>No reviews yet</h2>
              <p>
                Visit any anime page and leave a review to see it here!
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

const ReviewCount = styled.span`
  font-family: "Montserrat", sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 215, 0, 0.1);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  margin-left: auto;
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ReviewCard = styled.div`
  display: flex;
  gap: 1.5rem;
  background: linear-gradient(145deg, rgba(40, 40, 40, 0.8), rgba(25, 25, 25, 0.9));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
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
  width: 90px;
  height: 130px;
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
    height: 160px;
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

const ReviewContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;

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

const RatingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.25rem 0.6rem;
  border-radius: 15px;
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const ReviewText = styled.p`
  font-family: "Inter", "Noto Sans JP", sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ReviewFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
`;

const ReviewDate = styled.span`
  font-family: "Inter", sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
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
  padding: 1.5rem;
`;

export default MyReviews;
