import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import styled from "styled-components";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { SiCrunchyroll, SiNetflix, SiPrime } from "react-icons/si";
import { MdOndemandVideo } from "react-icons/md";
import { useFavourites } from "../context/FavouritesContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import gsap from "gsap";
import AuthModal from "./AuthModal";

function AnimeItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [anime, setAnime] = useState({});
  const [characters, setCharacters] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { currentUser } = useAuth();
  const detailsRef = useRef(null);

  const {
    title,
    synopsis,
    trailer,
    duration,
    aired,
    season,
    images,
    rank,
    score,
    scored_by,
    popularity,
    status,
    rating,
    source,
    episodes,
    genres,
    mal_id,
  } = anime || {};

  const isFav = mal_id ? isFavourite(mal_id) : false;

  const getAnime = async (animeId) => {
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
      if (!response.ok) throw new Error("Failed to fetch anime data");
      const data = await response.json();
      setAnime(data.data || {});
      console.log(data.data);
    } catch (error) {
      console.error("Error fetching anime data:", error);
      setAnime({});
    }
  };

  const getCharacters = async (animeId) => {
    try {
      const response = await fetch(
        `https://api.jikan.moe/v4/anime/${animeId}/characters`
      );
      if (!response.ok) throw new Error("Failed to fetch characters data");
      const data = await response.json();
      setCharacters(data.data || []);
      console.log(data.data);
    } catch (error) {
      console.error("Error fetching characters data:", error);
      setCharacters([]);
    }
  };

  const imdbLink = title
    ? `https://www.imdb.com/find?q=${encodeURIComponent(title)}`
    : null;

  const animeUrl = mal_id
    ? `https://shonenanimeorbit.netlify.app/anime/${mal_id}`
    : "https://shonenanimeorbit.netlify.app/";

  useEffect(() => {
    if (id) {
      getAnime(id);
      getCharacters(id);
    }
  }, [id]);

  useEffect(() => {
    if (detailsRef.current) {
      gsap.fromTo(
        detailsRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, [anime]);

  const handleBack = () => navigate(-1);

  const handleFavouriteToggle = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    if (isFav) {
      removeFromFavourites(mal_id);
    } else {
      addToFavourites(anime);
    }
  };

  const watchLinks = [
    {
      name: "Crunchyroll",
      url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(
        title || ""
      )}`,
      icon: <SiCrunchyroll />,
      color: "#F47521",
    },
    {
      name: "Netflix",
      url: `https://www.netflix.com/search?q=${encodeURIComponent(
        title || ""
      )}`,
      icon: <SiNetflix />,
      color: "#E50914",
    },
    {
      name: "Prime Video",
      url: `https://www.amazon.com/s?k=${encodeURIComponent(
        title || ""
      )}&i=instant-video`,
      icon: <SiPrime />,
      color: "#00A8E1",
    },
    {
      name: "Hulu",
      url: `https://www.hulu.com/search?q=${encodeURIComponent(title || "")}`,
      icon: <MdOndemandVideo />,
      color: "#1CE783",
    },
    {
      name: "Hianime",
      url: `https://hianime.to/search?keyword=${encodeURIComponent(
        title || ""
      )}`,
      icon: <MdOndemandVideo />,
      color: "#FF6B9D",
    },
  ];

  return (
    <>
      <Helmet>
        <title>{`${title || "Anime"} - Anime Orbit`}</title>
        <meta
          name="description"
          content={`Explore ${title || "this anime"} on Anime Orbit: ${
            episodes || "multiple"
          } episodes, detailed characters, and more.`}
        />
        <meta
          name="keywords"
          content={`${
            title || "anime"
          }, anime details, episode count, anime orbit, anime database`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={animeUrl} />
        <meta
          property="og:title"
          content={`${title || "Anime"} - Anime Orbit`}
        />
        <meta
          property="og:description"
          content={`Details for ${title || "this anime"}: ${
            episodes || "multiple"
          } episodes and more on Anime Orbit.`}
        />
        <meta
          property="og:image"
          content={
            images?.jpg?.large_image_url || "%PUBLIC_URL%/animeorbit.jpg"
          }
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={animeUrl} />
        <meta
          name="twitter:title"
          content={`${title || "Anime"} - Anime Orbit`}
        />
        <meta
          name="twitter:description"
          content={`Details for ${title || "this anime"}: ${
            episodes || "multiple"
          } episodes and more on Anime Orbit.`}
        />
        <meta
          name="twitter:image"
          content={
            images?.jpg?.large_image_url || "%PUBLIC_URL%/animeorbit.jpg"
          }
        />
      </Helmet>

      <AnimeItemStyled>
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
        {images?.jpg?.large_image_url && (
          <div
            className="background"
            style={{ backgroundImage: `url(${images.jpg.large_image_url})` }}
          ></div>
        )}
        <div className="overlay"></div>

        <h1>{title || "Anime Title Not Available"}</h1>

        <FavouriteButton onClick={handleFavouriteToggle} isFav={isFav}>
          {isFav ? <FaHeart /> : <FaRegHeart />}
          <span>{isFav ? "Remove from Favourites" : "Add to Favourites"}</span>
        </FavouriteButton>

        <div className="details" ref={detailsRef}>
          <div className="detail">
            <div className="image">
              <img
                src={images?.jpg?.large_image_url || "placeholder.jpg"}
                alt={title || "Anime Image"}
              />
            </div>
            <div className="anime-details">
              <p>
                <span>Aired:</span> {aired?.string || "Not Available"}
              </p>
              <p>
                <span>Rating:</span> {rating || "Not Rated"}
              </p>
              <p>
                <span>Rank:</span> {rank || "Not Ranked"}
              </p>
              <p>
                <span>Score:</span> {score || "Not Scored"} ({scored_by || 0}{" "}
                users)
              </p>
              <p>
                <span>Popularity:</span> {popularity || "Not Available"}
              </p>
              <p>
                <span>Status:</span> {status || "Unknown"}
              </p>
              <p>
                <span>Source:</span> {source || "Unknown"}
              </p>
              <p>
                <span>Season:</span> {season || "Not Available"}
              </p>
              <p>
                <span>Total Episodes:</span> {episodes || "Not Available"}
              </p>
              <p>
                <span>Duration:</span> {duration || "Not Available"}
              </p>
              <p>
                <span>IMDb 🎬:</span>
                {imdbLink && (
                  <a href={imdbLink} target="_blank" rel="noopener noreferrer">
                    View on IMDb
                  </a>
                )}
              </p>
            </div>
          </div>
          <h3 className="plot">Main Plot:</h3>
          <p className="description">
            {synopsis
              ? showMore
                ? synopsis
                : `${synopsis.substring(0, 450)}...`
              : "Synopsis Not Available"}
            {synopsis && synopsis.length > 450 && (
              <button onClick={() => setShowMore(!showMore)}>
                {showMore ? " Show Less" : "Read More"}
              </button>
            )}
            <div className="genres">
              {genres?.map((genre) => (
                <span key={genre.mal_id} className="genre">
                  {genre.name}
                </span>
              ))}
            </div>
          </p>
        </div>

        <div className="watch-section">
          <h3 className="title">Where to Watch:</h3>
          <div className="watch-links">
            {watchLinks.map((link, index) => (
              <WatchLink
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                color={link.color}
              >
                <span className="icon">{link.icon}</span>
                <span className="name">{link.name}</span>
              </WatchLink>
            ))}
          </div>
        </div>

        <div className="trailer-section">
          <h3 className="title">Trailer:</h3>
          <div className="trailer-con">
            {trailer?.embed_url ? (
              <iframe
                src={`${trailer.embed_url}?autoplay=0`}
                title="Trailer Video"
                width="800"
                height="450"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="error">Trailer Not Available</div>
            )}
          </div>
        </div>

        <div className="characters-section">
          <h3 className="title">Characters:</h3>
          {characters.length > 0 ? (
            <div className="characters">
              {characters.map((character, index) => {
                const { role } = character;
                const { images, name, mal_id } = character.character || {};
                return (
                  <Link to={`/character/${mal_id}`} key={index}>
                    <div className="character">
                      <img
                        src={images?.jpg?.image_url || "placeholder.jpg"}
                        alt={name || "Character"}
                      />
                      <h4>{name || "Unknown"}</h4>
                      <p>{role || "Unknown"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="error">No Data Regarding Characters</div>
          )}
        </div>
      </AnimeItemStyled>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

const AnimeItemStyled = styled.div`
  position: relative;
  min-height: 100vh;
  padding: 2rem 5%;

  .back-btn {
    position: fixed;
    top: 1rem;
    left: 1rem;
    padding: 0.5rem 1rem;
    font-family: "Montserrat", sans-serif;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: white;
    background: rgba(58, 58, 58, 0.8);
    border: 2px solid white;
    border-radius: 8px;
    cursor: pointer;
    z-index: 10;
    transition: all 0.3s ease-in-out;
    &:hover {
      background: #ff4d4d;
      border-color: #ff4d4d;
    }
  }

  .background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    filter: blur(3px);
    opacity: 1;
    z-index: -2;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(44, 44, 44, 0.64);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: -1;
  }

  h1 {
    font-family: "Staatliches", "Bebas Neue", cursive;
    font-size: 2.8rem;
    text-align: center;
    padding: 0.7rem 1.5rem;
    margin-bottom: 2rem;
    color: rgb(251, 249, 249);
    background: rgba(58, 58, 58, 0.2);
    border-radius: 14px;
    letter-spacing: 0.05em;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.5);
    transition: transform 0.3s ease-in-out, background 0.3s ease-in-out;

    &:hover {
      transform: scale(1.02);
      background: rgba(58, 58, 58, 0.4);
    }
  }

  .title {
    font-family: "Staatliches", "Bebas Neue", cursive;
    font-size: 1.8rem;
    text-align: left;
    padding: 0.5rem 1.2rem;
    margin: 2rem 0 1rem;
    color: rgb(251, 249, 249);
    background: rgba(58, 58, 58, 0.2);
    border-left: 4px solid black;
    border-radius: 3px 14px;
    letter-spacing: 0.05em;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    transition: transform 0.3s ease-in-out, background 0.3s ease-in-out;

    &:hover {
      transform: translateX(5px);
      background: rgba(58, 58, 58, 0.4);
    }
  }

  .plot {
    font-family: "Montserrat", sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    text-align: left;
    padding: 0.5rem 1.2rem;
    margin: 2rem 0 1rem;
    color: rgba(0, 0, 0, 0.9);
    border-left: 4px solid #333;
    border-radius: 0 14px 14px 0;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 2px rgba(101, 101, 101, 0.3);
  }

  .details {
    background: rgb(235, 235, 235);
    border-radius: 12px;
    padding: 2rem;
    border: 4px solid #333;
    margin-bottom: 2rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);

    .detail {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      align-items: center;

      .image {
        flex: 1;
        min-width: 250px;
        img {
          width: 100%;
          border-radius: 10px;
          transition: transform 0.3s ease-in-out;
          &:hover {
            transform: scale(1.03);
          }
        }
      }

      .anime-details {
        flex: 2;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        p {
          display: flex;
          gap: 0.5rem;
          font-family: "Inter", "Noto Sans JP", sans-serif;
          font-size: 1.05rem;
          font-weight: 500;
          color: rgb(0, 34, 87);
          line-height: 1.5rem;
          letter-spacing: 0.01em;
          span {
            font-family: "Montserrat", sans-serif;
            font-weight: 700;
            color: rgb(0, 0, 0);
            font-size: 1.1rem;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
          a {
            color: #27ae60;
            text-decoration: none;
            transition: color 0.3s ease-in-out;
            &:hover {
              color: #218c54;
            }
          }
        }
      }
    }

    .description {
      font-family: "Inter", "Noto Sans JP", sans-serif;
      font-size: 1rem;
      font-weight: 400;
      color: rgba(44, 43, 43, 0.96);
      line-height: 1.7rem;
      letter-spacing: 0.01em;
      margin-top: 1rem;

      button {
        background: none;
        border: none;
        font-family: "Montserrat", sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #27ae60;
        cursor: pointer;
        transition: color 0.3s ease-in-out;

        &:hover {
          color: #218c54;
        }
      }
    }

    .genres {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1.5rem;
      .genre {
        font-family: "Montserrat", sans-serif;
        background: rgba(17, 69, 114, 0.1);
        border: 2px solid #333;
        padding: 0.4rem 1rem;
        border-radius: 12px;
        color: black;
        font-weight: 700;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.3s ease-in-out, background 0.3s ease-in-out;
        &:hover {
          transform: translateY(-2px);
          background: rgba(51, 51, 51, 0.3);
        }
      }
    }
  }

  .trailer-section,
  .characters-section,
  .watch-section {
    margin-bottom: 2rem;
  }

  .watch-section {
    .watch-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      background: rgba(209, 209, 209, 0.1);
      padding: 2rem;
      border-radius: 14px;
      border: 2px solid rgba(255, 215, 0, 0.3);
      backdrop-filter: blur(10px);

      @media (max-width: 768px) {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        padding: 1.5rem;
      }
    }
  }

  .trailer-con {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
    iframe {
      width: 90%;
      max-width: 800px;
      height: 450px;
      border-radius: 14px;
      border: 4px solid black;
      background: #fff;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
    p {
      color: #fff;
      font-size: 1.1rem;
      text-align: center;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
  }

  .error {
    color: rgb(236, 236, 236);
    text-align: center;
    margin: 1rem;
  }

  .characters {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.5rem;
    background: rgba(209, 209, 209, 0.9);
    padding: 2rem;
    border-radius: 14px;
    border: 4px solid #333;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);

    .character {
      text-align: center;
      padding: 0.8rem;
      border-radius: 14px;
      background: rgba(251, 251, 251, 0.59);
      border: 2px solid rgb(191, 191, 191);
      transition: all 0.3s ease-in-out;
      &:hover {
        transform: translateY(-8px);
        background: #e0e0e0;
        border-color: rgb(0, 0, 0);
        box-shadow: 0 6px 12px rgba(50, 50, 50, 0.59);
      }
      img {
        width: 100%;
        height: auto;
        border-radius: 14px;
        border: solid;
        border-color: rgb(155, 155, 155);
      }
      h4 {
        font-family: "Inter", "Noto Sans JP", sans-serif;
        margin-top: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        text-align: left;
        color: #333;
        text-decoration: none;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        padding-left: 0.5rem;
        border-left: 3px solid #333;
        letter-spacing: 0.01em;
      }
      p {
        font-size: 1.1rem;
        color: #27ae60;
        font-weight: bold;
      }
    }
  }

  a {
    text-decoration: none;
    color: inherit;
  }
  @media (max-width: 768px) {
    padding: 1rem 3%;

    h1 {
      font-size: 2rem;
      padding: 0.5rem 1rem;
    }

    .title,
    .plot {
      font-size: 1.2rem;
      padding: 0.4rem 1rem;
    }

    .details {
      padding: 1.5rem;

      .detail {
        gap: 1rem;

        .image {
          min-width: 200px;
        }

        .anime-details p {
          font-size: 1rem;
          line-height: 1.3rem;
          text-overflow: hidden;
        }
      }
    }

    .trailer-con iframe {
      height: 250px;
    }

    .characters {
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      padding: 1rem;

      .character h4 {
        font-size: 0.9rem;
      }
    }

    .footer {
      font-size: 0.8rem;
    }
  }
`;

const FavouriteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  margin: 0 auto 2rem;
  background: ${(props) =>
    props.isFav
      ? "linear-gradient(135deg, #ff4d4d 0%, #ff6b6b 100%)"
      : "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 237, 78, 0.2) 100%)"};
  border: 2px solid ${(props) => (props.isFav ? "#ff4d4d" : "#ffd700")};
  border-radius: 12px;
  color: ${(props) => (props.isFav ? "white" : "#ffd700")};
  font-family: "Montserrat", sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px
    ${(props) =>
      props.isFav ? "rgba(255, 77, 77, 0.3)" : "rgba(255, 215, 0, 0.3)"};

  svg {
    font-size: 1.3rem;
  }

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 20px
      ${(props) =>
        props.isFav ? "rgba(255, 77, 77, 0.5)" : "rgba(255, 215, 0, 0.5)"};
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }

  @media (max-width: 768px) {
    padding: 0.8rem 1.5rem;
    font-size: 0.95rem;

    span {
      display: none;
    }

    svg {
      font-size: 1.5rem;
    }
  }
`;

const WatchLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid ${(props) => props.color || "#ffd700"};
  border-radius: 12px;
  color: ${(props) => props.color || "#ffd700"};
  text-decoration: none;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  .icon {
    font-size: 1.5rem;
    display: flex;
    align-items: center;
  }

  .name {
    font-family: "Montserrat", sans-serif;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  &:hover {
    background: ${(props) => props.color || "#ffd700"};
    color: white;
    transform: translateY(-5px);
    box-shadow: 0 8px 20px ${(props) => `${props.color || "#ffd700"}40`};
  }

  @media (max-width: 768px) {
    padding: 0.8rem 1rem;
    font-size: 0.85rem;

    .icon {
      font-size: 1.2rem;
    }
  }
`;

export default AnimeItem;
