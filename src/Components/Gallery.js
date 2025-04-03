import React, { useState, useEffect, memo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGlobalContext } from '../context/global';

const GalleryImage = memo(({ src, alt, isSelected }) => (
  <img
    src={src || ''}
    alt={alt}
    loading="lazy"
    style={{
      border: isSelected ? '4px solid #27AE60' : '4px solid #e5e7eb',
      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
      transition: 'all .3s ease-in-out',
    }}
  />
));

function Gallery() {
  const { getAnimePictures, pictures } = useGlobalContext();
  const { id } = useParams();
  const [characterName, setCharacterName] = useState('Loading...');
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  // Fetch character name
  useEffect(() => {
    let isMounted = true;
    console.log('Fetching character for ID:', id);

    fetch(`https://api.jikan.moe/v4/characters/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error('Error loading character');
        return response.json();
      })
      .then((data) => {
        if (isMounted) {
          setCharacterName(data?.data?.name || 'Unknown Character');
        }
      })
      .catch((error) => {
        console.error('Error fetching character:', error.message);
        if (isMounted) setCharacterName('Error loading character');
      });

    return () => {
      isMounted = false; // Cleanup to prevent memory leaks
    };
  }, [id]);

  // Fetch anime pictures (Optimized)
  useEffect(() => {
    getAnimePictures(id);
  }, [getAnimePictures,id]);

  // Memoize event handlers
  const handleBack = useCallback(() => navigate(-1), [navigate]);
  const handlePrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const handleNext = useCallback(() => setIndex((i) => Math.min(i + 1, pictures.length - 1)), [pictures]);

  // Limit pictures to 10 & ensure array
  const optimizedPictures = Array.isArray(pictures) ? pictures.slice(0, 10) : [];

  if (!optimizedPictures.length) return <LoadingStyled>Loading gallery...</LoadingStyled>;

  return (
    <GalleryStyled>
      <div className="header">
        <div className="back">
          <button onClick={handleBack}>Back</button>
        </div>
        <h1 className="title">{characterName}</h1>
      </div>

      <div className="big-image-container">
        <button className="prev" onClick={handlePrev} disabled={index === 0}>&lt;</button>
        <div className="big-image">
          <img src={optimizedPictures[index]?.jpg?.image_url || ''} alt="Selected Anime" loading="lazy" />
        </div>
        <button className="next" onClick={handleNext} disabled={index === optimizedPictures.length - 1}>&gt;</button>
      </div>

      <div className="small-images">
        {optimizedPictures.map((picture, i) => (
          <div className="image-con" onClick={() => setIndex(i)} key={i}>
            <GalleryImage src={picture?.jpg?.image_url} alt={`Thumbnail ${i}`} isSelected={i === index} />
          </div>
        ))}
      </div>
    </GalleryStyled>
  );
}

// Styled components (unchanged)
const GalleryStyled = styled.div`
  background-color: rgb(44, 44, 44);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4rem;
  padding: 1rem 12%;
  .header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: black;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 20;
    .back {
      position: absolute;
      top: 1rem;
      left: 1.2rem;
      button {
        font-weight: 600;
        color: white;
        background: black;
        border: 2px solid white;
        padding: 0.5rem 0.7rem;
        border-radius: 8px;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.3s ease-in-out;
        &:hover {
          background: red;
          border-color: red;
          color: white;
        }
        &:active {
          transform: scale(0.95);
        }
      }
    }
    .title {
      font-family: 'Bungee', cursive;
      font-size: 1.7rem;
      font-weight: 700;
      text-align: center;
      flex-grow: 1;
      color: yellow;
      margin: 0;
      padding: 0 3rem;
    }
  }
  .big-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 100%;
    margin-top: 5rem;
    padding: 2px;
    .prev,
    .next {
      font-size: 2rem;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 10px;
      color: #333;
      transition: all 0.3s ease-in-out;
      border-radius: 15%;
      background-color: rgb(198, 192, 192);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 9;
      &:hover {
        background-color: #eb5757;
        color: white;
      }
      &:active {
        transform: translateY(-50%) scale(0.95);
      }
      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }
    .prev {
      left: 10px;
    }
    .next {
      right: 10px;
    }
    .big-image {
      display: inline-block;
      margin: 2rem 0;
      background-color: rgb(131, 131, 131);
      border-radius: 9px;
      border: 5px solid rgb(202, 202, 202);
      img {
        width: 360px;
        height: auto;
        max-width: 100%;
      }
    }
  }
  .small-images {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    width: 80%;
    padding: 2rem;
    border-radius: 9px;
    background-color: rgb(131, 131, 131);
    border: 4px solid rgb(161, 161, 161);

    .image-con {
      img {
        width: 5rem;
        height: 5rem;
        object-fit: cover;
        cursor: pointer;
        border-radius: 14px;
        border: 3px solid rgb(157, 157, 157);
      }
    }
  }

  @media (max-width: 756px) {
    padding: 0%;
    background-color: rgb(41, 41, 41);

    .header {
      padding: 1rem;

      .title {
        font-size: 1.2rem;
      }
    }

    .big-image img {
      width: 90%;
      height: auto;
    }
  }
`;

const LoadingStyled = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  background-color: rgb(44, 44, 44);
`;

export default Gallery;
