import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useFavourites } from "../context/FavouritesContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { FaHeart, FaTrash } from "react-icons/fa";
import gsap from "gsap";

const Favourites = () => {
  const { favourites, loading, removeFromFavourites } = useFavourites();
  const { currentUser } = useAuth();
  const cardsRef = useRef([]);

  useEffect(() => {
    if (favourites.length > 0 && cardsRef.current.length > 0) {
      gsap.fromTo(
        cardsRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.7)",
        }
      );
    }
  }, [favourites]);

  if (!currentUser) {
    return (
      <FavouritesStyled>
        <EmptyState>
          <FaHeart size={80} color="#ffd700" />
          <h2>Sign in to view your favourites</h2>
          <p>Keep track of your favorite anime by signing in!</p>
        </EmptyState>
      </FavouritesStyled>
    );
  }

  if (loading) {
    return (
      <FavouritesStyled>
        <LoadingState>Loading your favourites...</LoadingState>
      </FavouritesStyled>
    );
  }

  if (favourites.length === 0) {
    return (
      <FavouritesStyled>
        <EmptyState>
          <FaHeart size={80} color="#ffd700" />
          <h2>No favourites yet</h2>
          <p>Start adding your favorite anime to see them here!</p>
          <Link to="/">
            <BrowseButton>Browse Anime</BrowseButton>
          </Link>
        </EmptyState>
      </FavouritesStyled>
    );
  }

  return (
    <FavouritesStyled>
      <Header>
        <FaHeart size={30} color="#ffd700" />
        <h1>My Favourites</h1>
        <p>{favourites.length} anime in your collection</p>
      </Header>

      <AnimeGrid>
        {favourites.map((anime, index) => (
          <AnimeCard
            key={anime.mal_id}
            ref={(el) => (cardsRef.current[index] = el)}
          >
            <Link to={`/anime/${anime.mal_id}`}>
              <ImageWrapper>
                <img src={anime.image} alt={anime.title} />
                <ScoreBadge>{anime.score || "N/A"}</ScoreBadge>
              </ImageWrapper>
              <CardContent>
                <AnimeTitle>{anime.title}</AnimeTitle>
                <AnimeInfo>
                  {anime.episodes
                    ? `${anime.episodes} Episodes`
                    : "Episodes: N/A"}
                </AnimeInfo>
              </CardContent>
            </Link>
            <RemoveButton
              onClick={(e) => {
                e.preventDefault();
                removeFromFavourites(anime.mal_id);
              }}
            >
              <FaTrash /> Remove
            </RemoveButton>
          </AnimeCard>
        ))}
      </AnimeGrid>
    </FavouritesStyled>
  );
};

const FavouritesStyled = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  padding: 2rem 5%;
  color: white;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  animation: fadeIn 0.6s ease;

  h1 {
    font-family: "Staatliches", cursive;
    color: #ffd700;
    font-size: 2.8rem;
    font-weight: 400;
    margin: 1rem 0;
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.6);
  }

  p {
    font-family: "Inter", "Noto Sans JP", sans-serif;
    color: #b0b0b0;
    font-size: 1.05rem;
    font-weight: 400;
    letter-spacing: 0.01em;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const AnimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.5rem;
  }
`;

const AnimeCard = styled.div`
  background: rgba(58, 58, 58, 0.5);
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid #444;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-8px);
    border-color: #ffd700;
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
  }

  a {
    text-decoration: none;
    color: inherit;
    display: block;
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
`;

const ScoreBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: #ffd700;
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  border: 2px solid #ffd700;
`;

const CardContent = styled.div`
  padding: 1rem;
`;

const AnimeTitle = styled.h3`
  font-family: "Inter", "Noto Sans JP", sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.5rem;
  line-height: 1.4;
  letter-spacing: 0.01em;
  min-height: 2.6rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const AnimeInfo = styled.p`
  font-family: "Inter", "Noto Sans JP", sans-serif;
  color: #b0b0b0;
  font-size: 0.9rem;
  font-weight: 400;
  letter-spacing: 0.01em;
`;

const RemoveButton = styled.button`
  width: 100%;
  padding: 0.8rem;
  background: rgba(255, 77, 77, 0.2);
  border: none;
  border-top: 2px solid rgba(255, 77, 77, 0.3);
  color: #ff4d4d;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: rgba(255, 77, 77, 0.3);
    color: white;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  animation: fadeIn 0.6s ease;

  h2 {
    font-family: "Staatliches", cursive;
    color: #ffd700;
    font-size: 2.5rem;
    font-weight: 400;
    margin: 1.5rem 0 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  }

  p {
    font-family: "Inter", "Noto Sans JP", sans-serif;
    color: #b0b0b0;
    font-size: 1.1rem;
    font-weight: 400;
    letter-spacing: 0.01em;
    margin-bottom: 2rem;
  }
`;

const BrowseButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a1a;
  border: none;
  border-radius: 10px;
  font-family: "Montserrat", sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  font-family: "Inter", "Noto Sans JP", sans-serif;
  font-size: 1.2rem;
  font-weight: 500;
  color: #ffd700;
`;

export default Favourites;
