import React from 'react';
import { useGlobalContext } from '../context/global';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

function Upcoming() {
  const { upcomingAnime, isSearch, searchResults } = useGlobalContext();

  const conditionalRender = () => {
    if (!isSearch) {
      return upcomingAnime?.map((anime) => (
        <Link to={`/anime/${anime.mal_id}`} key={`upcoming-${anime.mal_id}`}>
          <div className="anime-card">
            <div className="image-wrapper">
              <img src={anime.images.jpg.large_image_url} alt={anime.title} />
            </div>
            <p className="anime-title">{anime.title}</p>
          </div>
        </Link>
      ));
    } else {
      return searchResults?.map((anime) => (
        <Link to={`/anime/${anime.mal_id}`} key={`search-${anime.mal_id}`}>
          <div className="anime-card">
            <div className="image-wrapper">
              <img src={anime.images.jpg.large_image_url} alt={anime.title} />
            </div>
            <p className="anime-title">{anime.title}</p>
          </div>
        </Link>
      ));
    }
  };

  return (
    <UpcomingStyled>
      <div className="upcoming-anime">
        <h2>{isSearch ? "Search Results" : "Upcoming Anime"}</h2>
        <div className="anime-grid">{conditionalRender()}</div>
      </div>
    </UpcomingStyled>
  );
}

const UpcomingStyled = styled.div`
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
  }

  .upcoming-anime {
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
    text-decoration: none; /* Ensure no underline on link */
    color: inherit; /* Prevent blue default link color */
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
      text-decoration: none; /* Explicitly remove underline */
    }
  }

  @media (max-width: 480px) {
    padding: 1rem 0;

    .upcoming-anime {
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
  }

  @media (min-width: 768px) {
    .upcoming-anime {
      width: 90%;
      padding: 1rem;
    }

    h2 {
      font-size: 2rem;
    }
  }
`;

export default Upcoming;