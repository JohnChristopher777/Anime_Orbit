
import React, { memo } from "react";
import { Link } from "react-router-dom";
import { useGlobalContext } from "../context/global";
import styled from "styled-components";

function Popular({ rendered, popularAnime }) {
  const { trendingAnime } = useGlobalContext();
  const safePopularAnime = popularAnime || [];
  const safeTrendingAnime = trendingAnime || [];


  if (!safePopularAnime.length && !safeTrendingAnime.length) {
    return <p className="no-content">No anime available yet.</p>;
  }

  return (
    <PopularStyled>
      {/* Popular Anime Section (First 25 Results) */}
      {safePopularAnime.length > 0 && (
        <div className="popular-anime">
          <h2>{rendered === "search" ? "Search Results" : "Popular Anime"}</h2>
          <div className="anime-grid">
            {safePopularAnime.slice(0, 25).map((anime) => (
              <Link to={`/anime/${anime.mal_id}`} key={`popular-${anime.mal_id}`}>
                <div className="anime-card">
                  <div className="image-wrapper">
                    <img src={anime.images.jpg.large_image_url} alt={anime.title} />
                  </div>
                  <p className="anime-title">{anime.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Anime Section (Top 10 Current Trending) */}
      {rendered !== "search" && safeTrendingAnime.length > 0 && (
        <div className="trending-anime">
          <h2>
            <i className="bi bi-graph-up-arrow"></i> Top 10 Current Trending
          </h2>
          <div className="trending-container">
            {safeTrendingAnime.slice(0, 10).map((anime, index) => (
              <Link to={`/anime/${anime.mal_id}`} key={`trending-${anime.mal_id}`}>
                <div className="trending-card">
                  <span className="number">{index + 1}</span>
                  <div className="image-wrapper">
                    <img src={anime.images.jpg.large_image_url} alt={anime.title} />
                  </div>
                  <p className="trending-title">{anime.title}</p> {/* Added title */}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PopularStyled>
  );
}

const PopularStyled = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 0;
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);

  h2 {
    font-family: "Bungee", cursive;
    color: #ffd700;
    font-size: 1.5rem;
    margin-bottom: 1.5rem;

    .bi-graph-up-arrow {
      margin-right: 0.5rem;
      font-size: 1.2rem;
      vertical-align: middle;
    }
  }

  .popular-anime,
  .trending-anime {
    width: 90%;
    max-width: 1200px;
    padding: 1rem;
    margin-bottom: 2rem;
  }

  .anime-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
  }

  a {
    display: block;
    text-decoration: none; /* Ensure no underline on links */
    color: inherit; /* Prevent default link color */
  }

  .anime-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    border: 2px solid #5a5a5a;
    border-radius: 14px;
    overflow: hidden;
    background: #3a3a3a;
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out;

    &:hover {
      transform: translateY(-9px);
      box-shadow: 0 6px 12px rgba(255, 215, 0, 0.5);
      border-color: #ffea00;
    }

    .image-wrapper {
      width: 100%;
      overflow: hidden;
      border-radius: 8px;
      img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        transition: transform 0.3s ease-in-out;
      }
    }

    &:hover .image-wrapper img {
      transform: scale(1.03);
    }

    .anime-title {
      margin-top: 10px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #f0f0f0;
      text-align: center;
      padding: 0 10px;
      line-height: 1.3;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      text-decoration: none; /* Ensure no underline */
    }
  }

  .trending-container {
    display: flex;
    overflow-x: auto;
    gap: 1.5rem;
    padding: 0.5rem 0;
    scrollbar-width: thin;
    scrollbar-color: #ffd700 #2c2c2c;

    &::-webkit-scrollbar {
      height: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: #ffd700;
      border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
      background: #2c2c2c;
    }
  }

  .trending-card {
    margin-top: 0.5rem;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 120px;
    padding: 0.5rem;
    border: 2px solid rgb(0, 0, 0);
    border-radius: 12px;
    background: linear-gradient(145deg, #3a3a3a, #252525);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(255, 215, 0, 0.5);
      border-color: #ffea00;
    }

    .number {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffd700;
      color: #1a1a1a;
      font-size: 1rem;
      font-weight: bold;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      border: 2px solid #1a1a1a;
    }

    .image-wrapper {
      width: 130px;
      height: 200px;
      overflow: hidden;
      border-radius: 8px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
      }
    }

    .trending-title {
      margin-top: 5px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #f0f0f0;
      text-align: center;
      padding: 0 5px;
      line-height: 1.2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      text-decoration: none; /* Ensure no underline */
      max-width: 130px; /* Match image width */
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis; /* Handle long titles */
    }
  }

  .no-content {
    color: #d0d0d0;
    font-size: 1.1rem;
    text-align: center;
    padding: 1rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  @media (max-width: 480px) {
    padding: 1rem 0;

    .popular-anime,
    .trending-anime {
      width: 95%;
      padding: 0.5rem;
    }

    .anime-grid {
      gap: 1.5rem;
    }

    .anime-card {
      padding: 0.75rem;

      .anime-title {
        font-size: 1rem;
        padding: 0 5px;
      }
    }

    .trending-container {
      gap: 1rem;
    }

    .trending-card {
      min-width: 100px;
      padding: 0.4rem;

      .number {
        font-size: 0.9rem;
        width: 20px;
        height: 20px;
      }

      .image-wrapper {
        width: 80px;
        height: 80px;
      }

      .trending-title {
        font-size: 0.8rem;
        max-width: 80px;
      }
    }
  }

  @media (min-width: 768px) {
    .popular-anime,
    .trending-anime {
      width: 90%;
      padding: 1rem;
    }

    h2 {
      font-size: 2rem;
    }
  }
`;

export default memo(Popular);