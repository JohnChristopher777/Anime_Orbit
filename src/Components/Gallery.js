import React, { useState, useEffect, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGlobalContext } from '../context/global';

// Memoize the Image component to prevent unnecessary re-renders
const GalleryImage = memo(function GalleryImage({ src, alt, isSelected }) {
  return (
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
  );
});

function Gallery() {
  const { getAnimePictures, pictures } = useGlobalContext();
  const { id } = useParams();
  const [characterName, setCharacterName] = useState('Loading...');
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(function () {
    console.log('Fetching character for ID:', id);
    fetch('https://api.jikan.moe/v4/characters/' + id)
      .then(function (response) {
        if (!response.ok) {
          setCharacterName('Error loading character');
          return null;
        }
        return response.json();
      })
      .then(function (data) {
        setCharacterName(data && data.data && data.data.name ? data.data.name : 'Unknown Character');
      })
      .catch(function (error) {
        console.error('Error fetching character:', error.message);
        setCharacterName('Error loading character');
      });

    getAnimePictures(id);
  }, [id, getAnimePictures]);

  // Optimize pictures: limit to 10, ensure array
  const optimizedPictures = Array.isArray(pictures) ? pictures.slice(0, 10) : [];

  // Prevent render if no pictures
  if (optimizedPictures.length === 0) {
    return <LoadingStyled>Loading gallery...</LoadingStyled>;
  }

  return (
    <GalleryStyled>
      <div className="header">
        <div className="back">
          <button onClick={function () { navigate(-1); }}>Back</button>
        </div>
        <h1 className="title">{characterName}</h1>
      </div>
      <div className="big-image-container">
        <button
          className="prev"
          onClick={function () { setIndex(Math.max(index - 1, 0)); }}
          disabled={index === 0}
        >
          &lt;
        </button>
        <div className="big-image">
          <img
            src={optimizedPictures[index]?.jpg?.image_url || ''}
            alt="Selected Anime"
            loading="lazy"
          />
        </div>
        <button
          className="next"
          onClick={function () { setIndex(Math.min(index + 1, optimizedPictures.length - 1)); }}
          disabled={index === optimizedPictures.length - 1}
        >
          &gt;
        </button>
      </div>
      <div className="small-images">
        {optimizedPictures.map(function (picture, i) {
          return (
            <div
              className="image-con"
              onClick={function () { setIndex(i); }}
              key={i}
            >
              <GalleryImage
                src={picture?.jpg?.image_url}
                alt={`Thumbnail ${i}`}
                isSelected={i === index}
              />
            </div>
          );
        })}
      </div>
    </GalleryStyled>
  );
}

var GalleryStyled = styled.div`
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
    z-index: 10;

    .back {
      position: absolute;
      top: 1rem;
      left: 1.2rem;

      button {
        font-weight: 600;
        color: rgb(255, 255, 255);
        background: rgb(0, 0, 0);
        border: 2px solid rgb(255, 255, 255);
        padding: 0.5rem 0.7rem;
        border-radius: 8px;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.3s ease-in-out;

        &:hover {
          background: rgb(255, 39, 39);
          border-color: rgb(255, 39, 39);
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
      color: rgb(255, 227, 18);
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
      z-index: 10;

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

var LoadingStyled = styled.div`
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