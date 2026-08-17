import React, { useState, Suspense, lazy } from "react";
import Upcoming from "./Upcoming.jsx";
import Airing from "./Airing.jsx";
import { useGlobalContext } from "../context/global.jsx";
import styled from "styled-components";
import HeroCarousel from "./HeroCarousel.jsx";
import { Flame, Radio, Calendar } from "lucide-react";

const Popular = lazy(() => import("./Popular"));

function Homepage() {
  const {
    search,
    handleChange,
    popularAnime,
    searchResults,
    loading,
    topAiringAnime,
  } = useGlobalContext();

  const switchComponent = () => {
    const safeSearchResults = Array.isArray(searchResults) ? searchResults : [];
    const safePopularAnime = Array.isArray(popularAnime) ? popularAnime : [];

    if (loading && !safePopularAnime.length && !safeSearchResults.length) {
      return <div className="loading-spinner">Loading anime...</div>;
    }

    if (search) {
      if (safeSearchResults.length > 0) {
        return (
          <Popular
            rendered="search"
            popularAnime={safeSearchResults}
          />
        );
      } else {
        return (
          <div className="no-data">No Anime available for this search</div>
        );
      }
    }

    return safePopularAnime.length > 0 ? (
      <Popular
        rendered="popular"
        popularAnime={safePopularAnime}
      />
    ) : (
      <div className="no-data">No popular anime available yet</div>
    );
  };

  return (
    <HomepageStyled>
      {!search && <HeroCarousel trendingAnime={topAiringAnime} />}

      <main className={search ? "search-active" : ""}>
        <Suspense
          fallback={<div className="loading-spinner">Loading component...</div>}
        >
          {switchComponent()}
        </Suspense>
      </main>

      <footer className="footer">
        <p>
          © {new Date().getFullYear()} Anime Orbit | For fair use & educational
          purposes only
        </p>
      </footer>
    </HomepageStyled>
  );
}

const HomepageStyled = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  color: white;
  font-family: "Poppins", sans-serif;
  display: flex;
  flex-direction: column;

  .header-bar {
    display: flex;
    flex-direction: row;
    justify-content: center;
    text-align: center;
    padding: 1rem;
    background: #1a1a1a;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);

    .brand {
      font-family: "Bungee", cursive;
      font-size: 1.8rem;
      font-weight: bold;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #ffd700;
      text-align: center;
      text-shadow: 0 0 20px rgba(255, 215, 0, 0.5),
        0 0 30px rgba(255, 215, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .catchphrase {
      font-family: "Inter", "Noto Sans JP", sans-serif;
      display: block;
      font-size: 0.9rem;
      color: #b0b0b0;
      font-style: italic;
      font-weight: 400;
      letter-spacing: 0.02em;
      animation: pulse 3s infinite;
      margin-top: 0.5rem;

      .highlight {
        color: #ffd700;
        font-weight: 600;
        text-shadow: 0 0 5px rgba(255, 215, 0, 0.7);
      }
    }

    .search-wrapper {
      display: flex;
      align-items: center;
      margin-top: 0.5rem;
      margin-left: 4rem;
    }

    .search-container {
      display: flex;
      align-items: center;
      .search-form {
        display: flex;
        align-items: center;
        .input-control {
          position: relative;
          display: flex;
          align-items: center;
          input {
            width: ${(props) => (props.showSearch ? "300px" : "0")};
            opacity: ${(props) => (props.showSearch ? "1" : "0")};
            padding: ${(props) => (props.showSearch ? "0.8rem" : "0")};
            border: 2px solid #ffd700;
            border-radius: 8px 0 0 8px;
            background: #333;
            color: white;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            height: 40px;
            &.expanded {
              border-right: none;
            }
          }
          .clear-btn {
            position: absolute;
            right: 45px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #ffd700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            &:hover {
              color: #fff;
            }
          }
          .search-btn {
            background: #1a1a1a;
            border: 2px solid #ffd700;
            border-left: none;
            padding: 0.4rem 0.8rem;
            border-radius: 0 8px 8px 0;
            color: #ffd700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            height: 40px;
            display: flex;
            align-items: center;
            &:hover {
              background: #ffd700;
              color: #1a1a1a;
            }
          }
        }
      }
    }

    .search-toggle {
      background: #1a1a1a;
      border: 2px solid #ffd700;
      padding: 0.5rem 0.8rem;
      border-radius: 8px;
      color: #ffd700;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-left: ${(props) => (props.showSearch ? "0.5rem" : "0")};
      height: 36px;
      display: flex;
      align-items: center;
      &:hover {
        background: #ffd700;
        color: #1a1a1a;
      }
    }
  }

  header {
    padding: 1rem;
    .filter-buttons {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      .filter-btn {
        background: #4a4a4a;
        color: white;
        border: 2px solid #ffd700;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-family: "Montserrat", sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.3s ease;

        i {
          margin-right: 0.3rem;
        }

        &:hover {
          background: #ffd700;
          color: #1a1a1a;
          transform: translateY(-3px);
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
        }

        &.active {
          background: #ffd700;
          color: #1a1a1a;
        }
      }
    }
  }

  main {
    padding: 1rem;
    flex: 1;
    &.search-active {
      margin-top: 90px;
    }
  }

  .loading-spinner {
    text-align: center;
    color: #ffd700;
    font-size: 1rem;
    padding: 2rem;
  }

  .no-data {
    text-align: center;
    color: #b0b0b0;
    font-size: 1rem;
    padding: 2rem;
  }

  .footer {
    text-align: center;
    padding: 0.1rem;
    background: #1a1a1a;
    color: #b0b0b0;
    font-size: 0.7rem;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.02);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.8;
    }
  }

  @media (max-width: 767px) {
    .header-bar {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0.5rem;
      .brand {
        font-size: 1.5rem;
      }
      .catchphrase {
        font-size: 0.7rem;
      }
      .search-wrapper {
        flex-wrap: wrap;
        justify-content: center;
        padding-top: 14px;
        margin: auto;
      }
      .search-container {
        flex: 1;
        max-width: 100%;
        .search-form {
          .input-control {
            input {
              max-width: 200px;
              font-size: 0.8rem;
              padding: 0.6rem;
              height: 36px;
            }
            .clear-btn {
              right: 40px;
              font-size: 0.9rem;
            }
            .search-btn {
              padding: 0.3rem 0.6rem;
              font-size: 0.9rem;
              height: 36px;
            }
          }
        }
      }
      .search-toggle {
        padding: 0.4rem 0.6rem;
        font-size: 0.9rem;
        height: 36px;
      }
    }
    header {
      padding: 1rem;
      .filter-buttons {
        display: flex;
        justify-content: center;
        gap: 0.3rem;
        flex-wrap: nowrap;
        .filter-btn {
          padding: 0.4rem 0.7rem;
          font-size: 0.6rem;
          border-radius: 5px;
          border-width: 1px;
          i {
            margin-right: 0.2rem;
            font-size: 0.8rem;
          }
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 1px 6px rgba(255, 215, 0, 0.3);
          }
        }
      }
    }
    .footer {
      padding: 0.05rem;
      font-size: 0.6rem;
    }
  }
`;

export default Homepage;
