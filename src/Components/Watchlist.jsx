import React, { useState } from "react";
import styled from "styled-components";
import { useWatchlist } from "../context/WatchlistContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AnimeCard from "./AnimeCard.jsx";
import { List, CheckCircle, Bookmark, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TabButton = styled.button`
  background: ${({ active }) => (active ? "#ffd700" : "rgba(255, 255, 255, 0.05)")};
  color: ${({ active }) => (active ? "#1a1a1a" : "white")};
  border: 2px solid ${({ active }) => (active ? "#ffd700" : "rgba(255, 255, 255, 0.1)")};
  padding: 0.6rem 1.5rem;
  border-radius: 25px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #ffd700;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
  }
`;

const Grid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);

  h2 {
    font-family: "Montserrat", sans-serif;
    color: white;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  padding: 3rem;
`;

const Watchlist = () => {
  const { watchlist, watched, removeFromWatchlist, removeFromWatched, loading } = useWatchlist();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("watchlist");

  if (!currentUser) {
    return (
      <Container>
        <EmptyState>
          <LogIn size={64} color="#ffd700" />
          <h2>Sign in to track your watchlist</h2>
          <p>Create lists and mark episodes watched as you follow your favorite series.</p>
        </EmptyState>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingText>Loading watchlist data...</LoadingText>
      </Container>
    );
  }

  const currentList = activeTab === "watchlist" ? watchlist : watched;
  const handleRemove = activeTab === "watchlist" ? removeFromWatchlist : removeFromWatched;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <Container>
      <Header>
        <List size={32} color="#ffd700" />
        <h1>My Watchlist</h1>
      </Header>

      <TabContainer>
        <TabButton active={activeTab === "watchlist"} onClick={() => setActiveTab("watchlist")}>
          <Bookmark size={16} />
          <span>Watchlist ({watchlist.length})</span>
        </TabButton>
        <TabButton active={activeTab === "watched"} onClick={() => setActiveTab("watched")}>
          <CheckCircle size={16} />
          <span>Watched ({watched.length})</span>
        </TabButton>
      </TabContainer>

      <AnimatePresence mode="wait">
        {currentList.length > 0 ? (
          <Grid
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            {currentList.map((anime) => (
              <motion.div
                key={anime.mal_id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                {/* Remapped attributes to match AnimeCard schema expectations */}
                <AnimeCard
                  anime={{
                    mal_id: anime.mal_id,
                    title: anime.title,
                    title_english: anime.title_english,
                    image: anime.image_url || anime.image,
                    score: anime.score,
                    type: anime.type,
                    episodes: anime.episodes,
                  }}
                  onRemove={handleRemove}
                />
              </motion.div>
            ))}
          </Grid>
        ) : (
          <motion.div
            key={`empty-${activeTab}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <EmptyState>
              {activeTab === "watchlist" ? (
                <>
                  <Bookmark size={48} color="#ffd700" />
                  <h2>Your Watchlist is empty</h2>
                  <p>Start exploring anime to add them to your watch queue!</p>
                </>
              ) : (
                <>
                  <CheckCircle size={48} color="#ffd700" />
                  <h2>No Watched history yet</h2>
                  <p>Mark titles as Watched to build your viewing history.</p>
                </>
              )}
            </EmptyState>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default Watchlist;
