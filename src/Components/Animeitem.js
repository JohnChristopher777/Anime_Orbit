// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import styled from "styled-components";
// import { Link } from "react-router-dom";

// function AnimeItem() {
//   const { id } = useParams();

//   // State
//   const [anime, setAnime] = useState({});
//   const [characters, setCharacters] = useState([]);
//   const [showMore, setShowMore] = useState(false);

//   // Destructure anime safely
//   const {
//     title,
//     synopsis,
//     trailer,
//     duration,
//     aired,
//     season,
//     images,
//     rank,
//     score,
//     scored_by,
//     popularity,
//     status,
//     rating,
//     source,
//     episodes,
//     genres,
//   } = anime || {};

//   // Fetch anime details based on the ID
//   const getAnime = async (animeId) => {
//     try {
//       const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
//       const data = await response.json();
//       setAnime(data.data);
//       console.log(data.data);
//     } catch (error) {
//       console.error("Error fetching anime data:", error);
//     }
//   };

//   const imdbLink = title ? `https://www.imdb.com/find?q=${encodeURIComponent(title)}` : null;


//   // Get characters
//   const getCharacters = async (animeId) => {
//     try {
//       const response = await fetch(
//         `https://api.jikan.moe/v4/anime/${animeId}/characters`
//       );
//       const data = await response.json();
//       setCharacters(data.data);
//       console.log(data.data);
//     } catch (error) {
//       console.error("Error fetching characters data:", error);
//     }
//   };

//   // Initial renders
//   useEffect(() => {
//     if (id) {
//       getAnime(id);
//       getCharacters(id);
//     }
//   }, [id]);

//   return (
//     <AnimeItemStyled>
//       {images?.jpg?.large_image_url && (
//         <div
//           className="background"
//           style={{ backgroundImage: `url(${images.jpg.large_image_url})` }}
//         ></div>
//       )}

//       <div className="overlay"></div>
//       <h1>{title || "Anime Title Not Available"}</h1>
//       <div className="details">
//         <div className="detail">
//           <div className="image">
//             <img
//               src={images?.jpg?.large_image_url || "placeholder.jpg"}
//               alt={title || "Anime Image"}
//             />
//           </div>
//           <div className="anime-details">
//             <p>
//               <span>Aired:</span> {aired?.string || "Not Available"}
//             </p>
//             <p>
//               <span>Rating:</span> {rating || "Not Rated"}
//             </p>
//             <p>
//               <span>Rank:</span> {rank || "Not Ranked"}
//             </p>
//             <p>
//               <span>Score:</span> {score || "Not Scored"} ({scored_by || 0}{" "}
//               users)
//             </p>
//             <p>
//               <span>Popularity:</span> {popularity || "Not Available"}
//             </p>
//             <p>
//               <span>Status:</span> {status || "Unknown"}
//             </p>
//             <p>
//               <span>Source:</span> {source || "Unknown"}
//             </p>
//             <p>
//               <span>Season:</span> {season || "Not Available"}
//             </p>
//             <p>
//               <span>Total Episodes:</span> {episodes || "Not Available"}
//             </p>
//             <p>
//               <span>Duration:</span> {duration || "Not Available"}
//             </p>
//             <p>
//               <span>IMDb 🎬:</span>{" "}
//               {imdbLink && (
//                 <a href={imdbLink} target="_blank" rel="noopener noreferrer">
//                   View on IMDb
//                 </a>
//               )}
//             </p>
//           </div>
//         </div>
//         <h4 className="plot">Main Plot :</h4>
//         <p className="description">
//           {showMore ? synopsis : `${synopsis?.substring(0, 450)}...`}
//           <button onClick={() => setShowMore(!showMore)}>
//             {showMore ? " Show Less" : "Read More"}
//           </button>
//           <div className="genres">
//             {genres?.map((genre) => (
//               <span key={genre.mal_id} className="genre">
//                 {genre.name}
//               </span>
//             ))}
//           </div>
//         </p>
//       </div>
//       <br></br>
//       <div>
//         <h3 className="title">Trailer :</h3>
//         <br></br>
//         <div className="trailer-con">
//           {trailer?.embed_url ? (
//             <iframe
//               src={`${trailer.embed_url}?autoplay=0`}
//               title="Trailer Video"
//               width="800"
//               height="450"
//               allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//               allowFullScreen
//             ></iframe>
//           ) : (
//             <p>Trailer Not Available</p>
//           )}
//         </div>
//       </div>
//       <br></br>
//       <div>
//         <h3 className="title">Characters :</h3>
//         {characters.length > 0 ? (
//           <div className="characters">
//             {characters?.map((character, index) => {
//               const { role } = character;
//               const { images, name, mal_id } = character.character;
//               return (
//                 <Link to={`/character/${mal_id}`} key={index}>
//                   <div class="character">
//                     <img src={images?.jpg.image_url} alt="" />
//                     <h4>{name}</h4>
//                     <p>{role}</p>
//                   </div>
//                 </Link>
//               );
//             })}
//           </div>
//         ) : (
//           <p>No Data Regarding Characters</p>
//         )}
//       </div>
//     </AnimeItemStyled>
//   );
// }

// const AnimeItemStyled = styled.div`
//     padding: 1rem 12%;

//   .background {
//     position: fixed;
//     top: 0;
//     left: 0;
//     width: 100%;
//     height: 100%;
//     background-size: cover;
//     background-position: center;
//     filter: blur(3px);
//     opacity: 1;
//     z-index: -1;
//   }

//   .overlay {
//     position: fixed;
//     top: 0;
//     left: 0;
//     width: 100%;
//     height: 100%;
//     background: rgba(44, 44, 44, 0.64);
//     z-index: -1;
//   }

//   h1 {
//     font-size: 1.7re;
//     font-weight: 800;
//     text-transform: uppercase;
//     text-align: center;
//     letter-spacing: 1px;
//     padding: 0.7rem;
//     margin-bottom: 1.3rem;
//     border-radius: 20px;
    
//     color: rgb(255, 255, 255);
//     background: rgba(58, 58, 58, 0.06);
//     backdrop-filter: blur(4px);
//     -webkit-backdrop-filter: blur(10px);
//     transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
//     display: inline-block;

//     text-shadow: 4px 4px 10px rgba(0, 0, 0, 0.54),
//                0 0 15px rgba(0, 0, 0, 0.4),
//                0 0 25px rgba(0, 0, 0, 0.3);
//     &:hover {
//         transform: translateY(-5px);
//         opacity: 0.95;
//     }
// }



//   .title {
//     font-size: 1.5rem;
//     font-weight: 900;
//     text-align: center;
//     letter-spacing: 1px;
//     padding: 0.7rem;
//     margin-bottom: 1rem;
//     border-radius: 20px;
    
//     color: rgb(251, 249, 249);
//     background: rgba(0, 0, 0, 0.06);
//     backdrop-filter: blur(4px);
//     -webkit-backdrop-filter: blur(10px);
//     transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
//     display: inline-block;

//     text-shadow: 4px 4px 10px rgba(0, 0, 0, 0.54),
//                0 0 15px rgba(0, 0, 0, 0.4),
//                0 0 25px rgba(0, 0, 0, 0.3);
//     &:hover {
//         transform: translateY(-5px);
//         opacity: 0.95;
//     }
//   }
//   .plot{
//     font-size: 1.7rem;
//     margin-bottom: .5rem;
//     margin-top: 1.5rem;
//     background: linear-gradient(to left, rgb(23, 11, 78), rgb(58, 2, 97));
//     -webkit-background-clip: text;
//     -webkit-text-fill-color: transparent;
//     transition: transform 0.3s ease-in-out;
//   }
//   .description {
//     margin-top: 2rem 0;
//     color: rgb(32, 35, 37);
//     line-height: 1.7rem;

//     button {
//       background: none;
//       border: none;
//       font-size: 1.2rem;
//       font-weight: 600;
//       color: #27ae60;
//       cursor: pointer;
//       transition: color 0.3s ease-in-out;

//       &:hover {
//         cursor: pointer;
//         color: #218c54;
//       }
//     }
//   }

//   .genres {
//     display: flex;
//     flex-wrap: wrap;
//     gap: 0.5rem;
//     margin-top: 1.5rem;
    
//     .genre {
//       background: linear-gradient(45deg,rgb(247, 109, 23), #ff4b2b);
//       padding: 0.5rem 1rem;
//       border-radius: 20px;
//       color: white;
//       font-weight: bold;
//       font-size: 0.9rem;
//     }
//   }

//   @media (max-width: 768px) {
//     padding: 4%;
//     .genres {
//       justify-content: center;
//     }
//   }

//   .details {
//     background-color: #fff;
//     border-radius: 12px;
//     padding: 2rem;
//     border: 4px solid #e5e7eb;

//     .detail {
//       display: flex;
//       flex-wrap: wrap;
//       gap: 2rem;
//       align-items: center;

//       .image {
//         flex: 1;
//         min-width: 250px;

//         img {
//           width: 100%;
//           border-radius: 10px;
//           transition: transform 0.3s ease-in-out;

//           &:hover {
//             transform: scale(1.03);
//             cursor: pointer;
//           }
//         }
//       }

//       .anime-details {
//         flex: 2;
//         display: flex;
//         padding-left: 10px;
//         flex-direction: column;
//         gap: 1rem;

//         p {
//           display: flex;
//           gap: 0.9rem;
//           font-size: 1.4rem;

//           span {
//             font-weight: 600;
//             color: black;
//           }
//         }
//       }
//     }
//   }

//   .trailer-con {
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     margin-top: 1.5rem;

//     iframe {
//       width: 90%;
//       max-width: 800px;
//       padding: .5rem;
//       height: 450px;
//       border-radius: 14px;
//       background-color: rgb(14, 13, 13);
//       outline: none;
//       border: 4px solid #e5e7eb;
//     }
//   }

//   .characters {
//     display: grid;
//     grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
//     gap: 1.5rem;
//     background-color: white;
//     padding: 2rem;
//     border-radius: 14px;
//     border: 4px solid #e5e7eb;
//     margin-top: 2rem;

//     .character {
//       text-align: center;
//       padding: 0.8rem;
//       border-radius: 14px;
//       background-color: #ededed;
//       transition: all 0.3s ease-in-out;
//       cursor: pointer;

//       img {
//         width: 100%;
//         height: auto;
//         border-radius: 14px;
//       }

//       h4 {
//         margin-top: .5rem;
//         font-size: 1rem;
//         color: #333;
//       }

//       p {
//         font-size: 0.9rem;
//         color: #27ae60;
//       }

//       &:hover {
//         transform: translateY(-8px);
//         background-color: #e0e0e0;
//       }
//     }
//   }

//   @media (max-width: 768px) {
//     .details {
//       padding: 1.5rem;
//     }

//     .trailer-con iframe {
//       height: 280px;
//     }

//     .characters {
//       grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
//       padding: 1rem;
//     }
//   }
// `;


// export default AnimeItem;


import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";

function AnimeItem() {
  const { id } = useParams();

  // State
  const [anime, setAnime] = useState({});
  const [characters, setCharacters] = useState([]);
  const [showMore, setShowMore] = useState(false);

  // Destructure anime safely
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
  } = anime || {};

  // Fetch anime details
  const getAnime = async (animeId) => {
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
      const data = await response.json();
      setAnime(data.data);
      console.log(data.data);
    } catch (error) {
      console.error("Error fetching anime data:", error);
    }
  };

  // Fetch characters
  const getCharacters = async (animeId) => {
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/characters`);
      const data = await response.json();
      setCharacters(data.data);
      console.log(data.data);
    } catch (error) {
      console.error("Error fetching characters data:", error);
    }
  };

  // IMDb link and placeholder rating
  const imdbLink = title ? `https://www.imdb.com/find?q=${encodeURIComponent(title)}` : null;
  const imdbRating = "N/A"; // Placeholder; use OMDB API for real data

  useEffect(() => {
    if (id) {
      getAnime(id);
      getCharacters(id);
    }
  }, [id]);

  return (
    <AnimeItemStyled>
      {images?.jpg?.large_image_url && (
        <div
          className="background"
          style={{ backgroundImage: `url(${images.jpg.large_image_url})` }}
        ></div>
      )}
      <div className="overlay"></div>

      <h1>{title || "Anime Title Not Available"}</h1>
      <div className="details">
        <div className="detail">
          <div className="image">
            <img
              src={images?.jpg?.large_image_url || "placeholder.jpg"}
              alt={title || "Anime Image"}
            />
          </div>
          <div className="anime-details">
            <p><span>Aired:</span> {aired?.string || "Not Available"}</p>
            <p><span>Rating:</span> {rating || "Not Rated"}</p>
            <p><span>Rank:</span> {rank || "Not Ranked"}</p>
            <p><span>Score:</span> {score || "Not Scored"} ({scored_by || 0} users)</p>
            <p><span>Popularity:</span> {popularity || "Not Available"}</p>
            <p><span>Status:</span> {status || "Unknown"}</p>
            <p><span>Source:</span> {source || "Unknown"}</p>
            <p><span>Season:</span> {season || "Not Available"}</p>
            <p><span>Total Episodes:</span> {episodes || "Not Available"}</p>
            <p><span>Duration:</span> {duration || "Not Available"}</p>
            <p>
              <span>IMDb 🎬:</span> Rating: {imdbRating}{" "}
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
          {showMore ? synopsis : `${synopsis?.substring(0, 450)}...`}
          <button onClick={() => setShowMore(!showMore)}>
            {showMore ? " Show Less" : "Read More"}
          </button>
          <div className="genres">
            {genres?.map((genre) => (
              <span key={genre.mal_id} className="genre">{genre.name}</span>
            ))}
          </div>
        </p>
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
              const { images, name, mal_id } = character.character;
              return (
                <Link to={`/character/${mal_id}`} key={index}>
                  <div className="character">
                    <img src={images?.jpg.image_url} alt={name} />
                    <h4>{name}</h4>
                    <p>{role}</p>
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
  );
}

const AnimeItemStyled = styled.div`
  position: relative;
  min-height: 100vh;
  padding: 2rem 5%;

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
    font-family: "Bungee", cursive;
    font-size: 2.5rem; /* Larger */
    text-align: center; /* Centered */
    padding: 0.7rem 1.5rem;
    margin-bottom: 2rem;
    color: rgb(251, 249, 249);
    background: rgba(58, 58, 58, 0.2);
    border-radius: 14px; 
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.5);
    transition: transform 0.3s ease-in-out, background 0.3s ease-in-out;

    &:hover {
      transform: scale(1.02); /* Slight scale instead of slide */
      background: rgba(58, 58, 58, 0.4);
    }
  }

  .title {
    font-family: "Bungee", cursive;
    font-size: 1.5rem;
    text-align: left;
    padding: 0.5rem 1.2rem;
    margin: 2rem 0 1rem;
    color: rgb(251, 249, 249);
    background: rgba(58, 58, 58, 0.2);
    border-left: 4px solid black; /* Dark gray */
    border-radius: 3 14px;
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.5);
    transition: transform 0.3s ease-in-out, background 0.3s ease-in-out;

    &:hover {
      transform: translateX(5px);
      background: rgba(58, 58, 58, 0.4);
    }
  }

  .plot {
    font-family: "Bungee", cursive;
    font-size: 1.5rem;
    text-align: left;
    padding: 0.5rem 1.2rem;
    margin: 2rem 0 1rem;
    color: rgba(0, 0, 0, 0.9);

    border-left: 4px solid #333; 
    border-radius: 0 14px 14px 0;
    text-shadow: 2px 2px 6px rgba(101, 101, 101, 0.5);
  }

  .details {
    background: rgb(235, 235, 235);
    border-radius: 12px;
    padding: 2rem;
    border: 4px solid #333; /* Dark gray */
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
        gap: 0.8rem; /* Reduced line spacing */

        p {
          display: flex;
          gap: 0.5rem;
          font-size: 1.1rem;
          font-weight: 570; /* Stronger font */
          color: rgb(0, 34, 87);
          line-height: 1.4rem; /* Reduced line spacing */

          span {
            font-weight: 600; /* Slightly bolder for spans */
            color: rgb(0, 0, 0);
            font-size: large;
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
      color: rgba(44, 43, 43, 0.96);
      line-height: 1.7rem;
      margin-top: 1rem;

      button {
        background: none;
        border: none;
        font-size: 1.1rem;
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
        background: rgba(17, 69, 114, 0.1); /* Subtle gray */
        border: 2px solid #333; /* Dark gray border */
        padding: 0.4rem 1rem;
        border-radius: 12px;
        color: black;
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.3s ease-in-out, background 0.3s ease-in-out;

        &:hover {
          transform: translateY(-2px);
          background: rgba(51, 51, 51, 0.3);
        }
      }
    }
  }

  .trailer-section, .characters-section {
    margin-bottom: 2rem;
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
      border: 4px solid black; /* Dark gray */
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

  .error{
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
    border: 4px solid #333; /* Dark gray */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);

    .character {
      text-align: center;
      padding: 0.8rem;
      border-radius: 14px;
      background:rgba(251, 251, 251, 0.59);
      border: 2px solid rgb(191, 191, 191); /* Light gray outer border */
      transition: all 0.3s ease-in-out;

      &:hover {
        transform: translateY(-8px);
        background: #e0e0e0;
        border-color: rgb(0, 0, 0); /* Dark gray on hover */
        box-shadow: 0 6px 12px rgba(50, 50, 50, 0.59);
      }

      img {
        width: 100%;
        height: auto;
        border-radius: 14px;
        border: solid;
        border-color: rgb(155, 155, 155); /* Inner black border */
      }

      h4 {
        font-family: "Bungee", cursive;
        margin-top: 0.5rem;
        font-size: 1rem;
        text-align: left;
        color: #333; 
        text-decoration: none;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        padding-left: 0.5rem;
        border-left: 3px solid #333; /* Dark gray */
      }

      p {
        font-size: 1.1rem;
        color: #27ae60;
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

    .title, .plot {
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
        }
      }
    }

    .trailer-con iframe {
      height: 280px;
    }

    .characters {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
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

export default AnimeItem;