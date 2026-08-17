import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Star, Trash } from "lucide-react";

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  background: #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #3a3a3a;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 20px rgba(255, 215, 0, 0.3);
    border-color: #ffd700;
  }
`;

const ImageWrapper = styled.div`
  width: 100%;
  aspect-ratio: 2 / 3;
  position: relative;
  overflow: hidden;
  background: #1f1f1f;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  ${CardContainer}:hover & img {
    transform: scale(1.05);
  }
`;

const ScoreBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid #ffd700;
  color: #ffd700;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 2;
`;

const CardContent = styled.div`
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const AnimeTitle = styled.h3`
  font-family: "Montserrat", sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.4rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.4rem;
  line-height: 1.2rem;
  transition: color 0.3s ease;

  ${CardContainer}:hover & {
    color: #ffd700;
  }
`;

const AnimeInfo = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const RemoveButton = styled.button`
  width: 100%;
  background: rgba(255, 77, 77, 0.1);
  border: none;
  border-top: 1px solid rgba(255, 77, 77, 0.2);
  color: #ff4d4d;
  padding: 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #ff4d4d;
    color: white;
  }
`;

const AnimeCard = React.forwardRef(({ anime, onRemove }, ref) => {
  const imageUrl = anime.images?.jpg?.large_image_url || 
                   anime.images?.jpg?.image_url || 
                   anime.image || 
                   anime.image_url || 
                   "";
                   
  const displayTitle = anime.title || anime.title_english || "Unknown Anime";
  const score = anime.score;

  return (
    <CardContainer ref={ref}>
      <Link to={`/anime/${anime.mal_id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ImageWrapper>
          <img src={imageUrl} alt={displayTitle} loading="lazy" />
          {score && (
            <ScoreBadge>
              <Star size={12} fill="#ffd700" color="#ffd700" />
              <span>{score}</span>
            </ScoreBadge>
          )}
        </ImageWrapper>
        <CardContent>
          <AnimeTitle>{displayTitle}</AnimeTitle>
          <AnimeInfo>
            <span>{anime.type || "TV"}</span>
            <span>{anime.episodes ? `${anime.episodes} EP` : "N/A"}</span>
          </AnimeInfo>
        </CardContent>
      </Link>
      {onRemove && (
        <RemoveButton onClick={(e) => {
          e.preventDefault();
          onRemove(anime.mal_id);
        }}>
          <Trash size={14} /> Remove
        </RemoveButton>
      )}
    </CardContainer>
  );
});

export default AnimeCard;
