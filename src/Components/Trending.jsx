import React, { useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { useGlobalContext } from "../context/global.jsx";
import AnimeCard from "./AnimeCard.jsx";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 80vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);
  padding-bottom: 1.5rem;

  h1 {
    font-family: "Staatliches", cursive;
    font-size: 2.8rem;
    color: #ffd700;
    margin: 0;
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
    letter-spacing: 0.05em;
  }
`;

const Grid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-family: "Montserrat", sans-serif;
  padding: 3rem;
`;

const LoadingMore = styled.div`
  text-align: center;
  padding: 2rem;
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
`;

const Trending = () => {
  const { trendingAnime, getTrendingAnime, loading, trendingPage, hasMoreTrending } = useGlobalContext();

  useEffect(() => {
    if (!trendingAnime || trendingAnime.length === 0) {
      getTrendingAnime(1);
    }
  }, []);

  // Infinite scroll observer
  const observerRef = useRef(null);
  const sentinelRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreTrending && !loading) {
          getTrendingAnime(trendingPage + 1);
        }
      }, { rootMargin: "200px" });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMoreTrending, trendingPage, getTrendingAnime]
  );

  return (
    <Container>
      <Header>
        <TrendingUp size={32} color="#ffd700" />
        <h1>Trending Now</h1>
      </Header>

      {loading && (!trendingAnime || trendingAnime.length === 0) ? (
        <Grid>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ padding: '1rem', background: '#3a3a3a', borderRadius: '14px', height: '320px' }}>
              <Skeleton height={200} borderRadius={8} baseColor="#2c2c2c" highlightColor="#3a3a3a" />
              <Skeleton width="80%" height={20} baseColor="#2c2c2c" highlightColor="#3a3a3a" style={{ marginTop: '1rem', marginBottom: '0.5rem' }} />
              <Skeleton width="40%" height={15} baseColor="#2c2c2c" highlightColor="#3a3a3a" />
            </div>
          ))}
        </Grid>
      ) : trendingAnime && trendingAnime.length > 0 ? (
        <>
          <Grid
            initial="hidden"
            animate="show"
          >
            {trendingAnime.map((anime) => (
              <motion.div
                key={anime.mal_id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <AnimeCard anime={anime} />
              </motion.div>
            ))}
          </Grid>
          {hasMoreTrending && (
            <LoadingMore ref={sentinelRef}>
              {loading ? "Loading more anime..." : ""}
            </LoadingMore>
          )}
        </>
      ) : (
        <EmptyState>No trending anime data available.</EmptyState>
      )}
    </Container>
  );
};

export default Trending;
