import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { Play, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

const HeroCarousel = ({ trendingAnime = [] }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (trendingAnime && trendingAnime.length > 0) {
      setIsLoading(false);
    }
  }, [trendingAnime]);

  if (isLoading || !trendingAnime.length) {
    return (
      <HeroContainer>
        <SkeletonWrapper>
          <div className="skeleton-content">
            <Skeleton width={180} height={30} baseColor="#2c2c2c" highlightColor="#3a3a3a" style={{ marginBottom: '1.5rem' }} />
            <Skeleton width="80%" height={50} baseColor="#2c2c2c" highlightColor="#3a3a3a" style={{ marginBottom: '1.5rem' }} />
            <Skeleton width="40%" height={24} baseColor="#2c2c2c" highlightColor="#3a3a3a" style={{ marginBottom: '1rem' }} />
            <Skeleton count={3} baseColor="#2c2c2c" highlightColor="#3a3a3a" style={{ marginBottom: '0.8rem' }} />
            <Skeleton width={150} height={45} borderRadius={25} baseColor="#2c2c2c" highlightColor="#3a3a3a" style={{ marginTop: '1.5rem' }} />
          </div>
          <div className="skeleton-image">
            <Skeleton width={250} height={375} borderRadius={12} baseColor="#2c2c2c" highlightColor="#3a3a3a" />
          </div>
        </SkeletonWrapper>
      </HeroContainer>
    );
  }

  const topAnime = trendingAnime.slice(0, 8);

  return (
    <HeroContainer>
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={false}
        loop={true}
        className="hero-swiper"
      >
        {topAnime.map((anime, index) => (
          <SwiperSlide key={anime.mal_id}>
            <HeroSlide
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <BackgroundImage
                style={{
                  backgroundImage: `url(${
                    anime.images?.jpg?.large_image_url ||
                    anime.images?.jpg?.image_url
                  })`,
                }}
              >
                <div className="overlay" />
              </BackgroundImage>

              <HeroContent>
                <motion.div
                  className="content-wrapper"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <div className="rank-badge">
                    <TrendingUp size={20} />
                    <span>#{index + 1} Weekly Top Airing</span>
                  </div>

                  <h1 className="anime-title">
                    {anime.title_english || anime.title}
                  </h1>

                  <div className="anime-meta">
                    {anime.score && (
                      <div className="score">
                        <Star size={18} fill="#ffea00" color="#ffea00" />
                        <span>{anime.score}</span>
                      </div>
                    )}
                    {anime.type && <span className="type">{anime.type}</span>}
                    {anime.episodes && (
                      <span className="episodes">
                        {anime.episodes} Episodes
                      </span>
                    )}
                    {anime.year && <span className="year">{anime.year}</span>}
                  </div>

                  <p className="synopsis">
                    {anime.synopsis?.slice(0, 180)}
                    {anime.synopsis?.length > 180 ? "..." : ""}
                  </p>

                  <div className="actions">
                    <Link to={`/anime/${anime.mal_id}`} className="watch-btn">
                      <Play size={20} fill="#1a1a1a" />
                      <span>View Details</span>
                    </Link>
                  </div>
                </motion.div>

                <FramedImage
                  as={motion.div}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <img
                    src={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url}
                    alt={anime.title}
                  />
                </FramedImage>
              </HeroContent>
            </HeroSlide>
          </SwiperSlide>
        ))}
      </Swiper>
    </HeroContainer>
  );
};

const FramedImage = styled.div`
  width: 250px;
  height: 375px;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid #ffd700;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #1a1a1a;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    transform: scale(1.03) translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.4);
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

const HeroContainer = styled.div`
  width: 100%;
  height: 85vh;
  max-height: 800px;
  position: relative;
  overflow: hidden;

  .hero-swiper {
    width: 100%;
    height: 100%;

    .swiper-pagination-bullet {
      background: rgba(255, 234, 0, 0.5);
      width: 12px;
      height: 12px;
      opacity: 0.7;

      &-active {
        background: #ffea00;
        opacity: 1;
        width: 32px;
        border-radius: 6px;
      }
    }
  }

  @media (max-width: 768px) {
    height: 70vh;
    max-height: 600px;
  }
`;

const LoadingHero = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  color: #ffea00;

  .loading-icon {
    animation: pulse 2s ease-in-out infinite;
    margin-bottom: 1rem;
  }

  p {
    font-family: "Montserrat", sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
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

const HeroSlide = styled(motion.div)`
  width: 100%;
  height: 100%;
  position: relative;
`;

const BackgroundImage = styled.div`
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center top;
  position: absolute;
  top: 0;
  left: 0;
  filter: blur(15px);
  opacity: 0.3;
  transform: scale(1.05);

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(26, 26, 26, 0.95) 0%,
      rgba(26, 26, 26, 0.7) 50%,
      rgba(26, 26, 26, 0.3) 100%
    );

    @media (max-width: 768px) {
      background: linear-gradient(
        to top,
        rgba(26, 26, 26, 0.98) 0%,
        rgba(26, 26, 26, 0.8) 50%,
        rgba(26, 26, 26, 0.5) 100%
      );
    }
  }
`;

const HeroContent = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
  padding: 0 8%;
  z-index: 2;
  width: 100%;

  .content-wrapper {
    max-width: 650px;
  }

  .rank-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 234, 0, 0.2);
    border: 2px solid #ffea00;
    color: #ffea00;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-family: "Montserrat", sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .anime-title {
    font-family: "Staatliches", cursive;
    font-size: 4rem;
    font-weight: 400;
    color: #ffffff;
    margin: 0 0 1rem 0;
    line-height: 1.1;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .anime-meta {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;

    .score {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-family: "Montserrat", sans-serif;
      font-weight: 700;
      font-size: 1.1rem;
      color: #ffea00;
    }

    span {
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      font-size: 0.95rem;
      color: #e0e0e0;
      padding: 0.3rem 0.8rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(5px);
      border-radius: 6px;
    }
  }

  .synopsis {
    font-family: "Inter", sans-serif;
    font-size: 1.05rem;
    line-height: 1.7;
    color: #d0d0d0;
    margin-bottom: 2rem;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  }

  .actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;

    .watch-btn,
    .info-btn {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.9rem 2rem;
      border-radius: 8px;
      font-family: "Montserrat", sans-serif;
      font-weight: 700;
      font-size: 1rem;
      text-decoration: none;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .watch-btn {
      background: #ffea00;
      color: #1a1a1a;
      border: 2px solid #ffea00;

      &:hover {
        background: transparent;
        color: #ffea00;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(255, 234, 0, 0.3);
      }
    }

    .info-btn {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.5);
        transform: translateY(-2px);
      }
    }
  }

  @media (max-width: 1200px) {
    .anime-title {
      font-size: 3rem;
    }
  }

  @media (max-width: 768px) {
    padding: 0 5%;
    align-items: flex-end;
    padding-bottom: 3rem;

    .content-wrapper {
      max-width: 100%;
    }

    .anime-title {
      font-size: 2rem;
    }

    .synopsis {
      font-size: 0.9rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .actions {
      .watch-btn,
      .info-btn {
        padding: 0.7rem 1.5rem;
        font-size: 0.9rem;
      }
    }
  }
`;

const SkeletonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  .skeleton-content {
    flex: 1;
    max-width: 600px;
  }

  .skeleton-image {
    margin-left: 2rem;
    @media (max-width: 900px) {
      display: none;
    }
  }
`;

export default HeroCarousel;
