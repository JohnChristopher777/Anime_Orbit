import React, { useState, useEffect, memo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGlobalContext } from "../context/global.jsx";
import styled from "styled-components";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { getCharacterDetails } from "../services/anilist";

const GalleryImage = memo(({ src, alt, isSelected }) => (
  <img
    src={src || ""}
    alt={alt}
    loading="lazy"
    style={{
      border: isSelected ? "4px solid #27AE60" : "4px solid #e5e7eb",
      transform: isSelected ? "scale(1.1)" : "scale(1)",
      transition: "all .3s ease-in-out",
    }}
  />
));

function Gallery() {
  const { getAnimePictures, pictures } = useGlobalContext();
  const { id } = useParams();
  const [characterName, setCharacterName] = useState("Loading...");
  const [index, setIndex] = useState(0);
  const [optimizedPictures, setOptimizedPictures] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const fetchCharacterName = async () => {
      try {
        const data = await getCharacterDetails(id);
        if (isMounted) {
          setCharacterName(data?.name?.full || "Unknown Character");
        }
      } catch (error) {
        console.error("Error fetching character:", error.message);
        if (isMounted) {
          setCharacterName("Error loading character");
        }
      }
    };

    fetchCharacterName();

    // Auto-exit if no images after 8 seconds
    timeoutId = setTimeout(() => {
      if (isMounted && optimizedPictures.length === 0) {
        console.log("No images found, returning to previous page");
        navigate(-1);
      }
    }, 8000);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [id, navigate, optimizedPictures.length]);

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
  const handleNext = useCallback(
    () => setIndex((i) => Math.min(i + 1, optimizedPictures.length - 1)),
    [optimizedPictures]
  );

  if (!optimizedPictures.length) {
    return (
      <LoadingStyled>
        <ImageIcon size={48} className="loading-icon" />
        <p>Loading gallery...</p>
        <div className="skeleton-container">
          <Skeleton
            height={400}
            width={360}
            baseColor="#3a3a3a"
            highlightColor="#5a5a5a"
          />
          <div className="thumbnails">
            {[...Array(10)].map((_, i) => (
              <Skeleton
                key={i}
                height={80}
                width={80}
                baseColor="#3a3a3a"
                highlightColor="#5a5a5a"
              />
            ))}
          </div>
        </div>
      </LoadingStyled>
    );
  }

  return (
    <GalleryStyled>
      <div className="header">
        <div className="back">
          <button onClick={handleBack} aria-label="Go Back">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
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
          <ChevronLeft size={32} />
        </button>

        <div className="big-image">
          <img
            src={optimizedPictures[index]?.jpg?.image_url || ""}
            alt={characterName}
            loading="lazy"
          />
          <div className="image-counter">
            {index + 1} / {optimizedPictures.length}
          </div>
        </div>

        <button
          className="next"
          onClick={handleNext}
          disabled={index === optimizedPictures.length - 1}
          aria-label="Next Image"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      <div className="small-images">
        {optimizedPictures.map((picture, i) => (
          <div
            className="image-con"
            onClick={() => setIndex(i)}
            key={picture?.jpg?.image_url || i}
          >
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
      font-family: "Montserrat", sans-serif;
      position: absolute;
      top: 1rem;
      left: 1.2rem;

      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 700;
        color: #f0f0f0;
        background: rgb(94, 94, 94);
        border: 2px solid rgb(0, 0, 0);
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: all 0.3s ease-in-out;

        &:hover {
          background: rgb(238, 218, 6);
          border-color: #ffea00;
          font-weight: bold;
          color: rgb(0, 0, 0);
          transform: translateX(-4px);
        }
        &:active {
          transform: scale(0.95) translateX(-4px);
        }
      }
    }

    .title {
      font-family: "Staatliches", cursive;
      font-size: 2.2rem;
      font-weight: 400;
      text-align: center;
      flex-grow: 1;
      color: #ffea00;
      margin: 0;
      padding: 0 4rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.5);
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
      font-family: "Montserrat", sans-serif;
      font-size: 2rem;
      font-weight: 700;
      background: rgba(90, 90, 90, 0.9);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 234, 0, 0.3);
      cursor: pointer;
      padding: 1rem;
      color: #f0f0f0;
      transition: all 0.3s ease-in-out;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 9;
      will-change: transform;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;

      &:hover {
        background: #ffea00;
        color: #1a1a1a;
        border-color: #ffea00;
        transform: translateY(-50%) scale(1.1);
        box-shadow: 0 6px 20px rgba(255, 234, 0, 0.4);
      }
      &:active {
        transform: translateY(-50%) scale(0.95);
      }
      &:disabled {
        cursor: not-allowed;
        opacity: 0.3;
        background: rgba(90, 90, 90, 0.5);
        border-color: rgba(90, 90, 90, 0.3);
        &:hover {
          transform: translateY(-50%);
        }
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
      border-radius: 12px;
      border: 5px solid #5a5a5a;
      overflow: hidden;
      position: relative;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);

      img {
        width: 360px;
        height: auto;
        max-width: 100%;
        display: block;
        transition: transform 0.3s ease;
      }

      .image-counter {
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        background: rgba(26, 26, 26, 0.9);
        backdrop-filter: blur(10px);
        color: #ffea00;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-family: "Montserrat", sans-serif;
        font-weight: 600;
        font-size: 0.9rem;
        border: 2px solid rgba(255, 234, 0, 0.3);
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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  color: #f0f0f0;
  font-family: "Inter", "Noto Sans JP", sans-serif;
  padding: 2rem;

  .loading-icon {
    color: #ffea00;
    animation: pulse 2s ease-in-out infinite;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.3rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    margin-bottom: 2rem;
  }

  .skeleton-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;

    .thumbnails {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }
`;

export default Gallery;
