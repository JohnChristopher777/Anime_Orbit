import React, { useState, useEffect, memo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/global';
import styled from 'styled-components';

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
  const [optimizedPictures, setOptimizedPictures] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchCharacterName = async () => {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/characters/${id}`);
        if (!res.ok) throw new Error('Error loading character');
        const data = await res.json();
        if (isMounted) {
          setCharacterName(data?.data?.name || 'Unknown Character');
        }
      } catch (error) {
        console.error('Error fetching character:', error.message);
        if (isMounted) {
          setCharacterName('Error loading character');
        }
      }
    };

    fetchCharacterName();
    return () => { isMounted = false; };
  }, [id]);


  useEffect(() => {
    if (id) {
      getAnimePictures(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  

  useEffect(() => {
    const sliced = Array.isArray(pictures) ? pictures.slice(0, 10) : [];
    setOptimizedPictures(sliced);
  }, [pictures]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);
  const handlePrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const handleNext = useCallback(() => setIndex((i) => Math.min(i + 1, optimizedPictures.length - 1)), [optimizedPictures]);

  if (!optimizedPictures.length) {
    return <LoadingStyled>Loading gallery...</LoadingStyled>;
  }

  return (
    <GalleryStyled>
      <div className="header">
        <div className="back">
          <button onClick={handleBack} aria-label="Go Back">Back</button>
        </div>
        <h1 className="title">{characterName}</h1>
      </div>

      <div className="big-image-container">
        <button
          className="prev"
          onClick={handlePrev}
          disabled={index === 0}
          aria-label="Previous Image"
        >
          &lt;
        </button>

        <div className="big-image">
          <img
            src={optimizedPictures[index]?.jpg?.image_url || ''}
            alt={characterName}
            loading="lazy"
          />
        </div>

        <button
          className="next"
          onClick={handleNext}
          disabled={index === optimizedPictures.length - 1}
          aria-label="Next Image"
        >
          &gt;
        </button>
      </div>

      <div className="small-images">
        {optimizedPictures.map((picture, i) => (
          <div className="image-con" onClick={() => setIndex(i)} key={picture?.jpg?.image_url || i}>
            <GalleryImage
              src={picture?.jpg?.image_url}
              alt={`Thumbnail ${i}`}
              isSelected={i === index}
            />
          </div>
        ))}
      </div>
    </GalleryStyled>
  );
}

const GalleryStyled = styled.div`
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
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
    background: #1a1a1a;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 20;

    .back {
      font-family: "Bungee", cursive;
      position: absolute;
      top: 1rem;
      left: 1.2rem;

      button {
        font-weight: 400;
        color: #f0f0f0;
        background:rgb(94, 94, 94);
        border: 2px solid rgb(0, 0, 0);
        padding: 0.5rem 0.7rem;
        border-radius: 8px;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.3s ease-in-out;

        &:hover {
          background:rgb(238, 218, 6);
          border-color: #ffea00;
          font-weight: bold;
          color:rgb(0, 0, 0);
        }
        &:active {
          transform: scale(0.95);
        }
      }
    }

    .title {
      font-family: "Bungee", cursive;
      font-size: 1.7rem;
      font-weight: 700;
      text-align: center;
      flex-grow: 1;
      color: #ffea00;
      margin: 0;
      padding: 0 4rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
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
      font-family: "Bungee", cursive;
      font-size: 2rem;
      background: #5a5a5a;
      border: none;
      cursor: pointer;
      padding: 10px;
      color: #f0f0f0;
      transition: all 0.3s ease-in-out;
      border-radius: 15%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 9;
      will-change: transform;

      &:hover {
        background: #ffea00;
        color: #1a1a1a;
      }
      &:active {
        transform: translateY(-50%) scale(0.95);
      }
      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        background: #5a5a5a;
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
      background: #3a3a3a;
      border-radius: 9px;
      border: 5px solid #5a5a5a;
      overflow: hidden;

      img {
        width: 360px;
        height: auto;
        max-width: 100%;
        display: block;
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
    background: #3a3a3a;
    border: 4px solid #5a5a5a;

    .image-con {
      img {
        width: 5rem;
        height: 5rem;
        object-fit: cover;
        cursor: pointer;
        border-radius: 14px;
        border: 3px solid #5a5a5a;
        transition: border-color 0.3s ease-in-out;

        &.active,
        &:hover {
          border-color: #ffea00;
        }
      }
    }
  }

  @media (max-width: 756px) {
    padding: 5%;
    background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);

    .header {
      padding: 1.5rem;

      .title {
        font-size: 1.2rem;
        margin-left: 8px;
      }
    }

    .big-image-container {
      .big-image {
        img {
          width: 90%;
          height: auto;
        }
      }
    }
  }

  @media (max-width: 700px) {
    .big-image-container {
      .prev,
      .next {
        font-size: 1.4rem;
        padding: 5px;
        background: #5a5a5a;
        border-radius: 15%;
        box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2);

        &:hover {
          background: #ffea00;
          color: #1a1a1a;
        }
        &:active {
          transform: translateY(-50%) scale(0.95);
        }
        &:disabled {
          opacity: 0.5;
        }
      }

      .prev {
        left: 5px;
      }

      .next {
        right: 5px;
      }

      .big-image {
        img {
          width: 100%;
          max-width: 300px;
          height: auto;
        }
      }
    }

    .small-images {
      justify-content: center;
      gap: 0.4rem;
      padding: 1rem;
      width: 85%;

      .image-con {
        flex: 0 0 calc(33.33% - 0.5rem);
        display: flex;
        justify-content: center;
        margin-top: 3px;
        margin-bottom: 2px;

        img {
          width: 4rem;
          height: 4rem;
          object-fit: cover;
          border-radius: 10px;
          border: 2px solid #5a5a5a;

          &.active,
          &:hover {
            border-color: #ffea00;
          }
        }
      }
    }
  }
`;

const LoadingStyled = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  color: #f0f0f0;
  font-size: 1.5rem;
  font-family: "Bungee", cursive;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);

  &::after {
    content: "";
    border: 4px solid #ffea00;
    border-top: 4px solid transparent;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
    margin-left: 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;



export default Gallery;



