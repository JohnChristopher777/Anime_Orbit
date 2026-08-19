import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { useWatchlist } from "../context/WatchlistContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AnimeCard from "./AnimeCard.jsx";
import {
  List,
  CheckCircle,
  Bookmark,
  LogIn,
  PlayCircle,
  PauseCircle,
  XCircle,
  Layers,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Watchlist = () => {
  const { watchlist, updateAnimeStatus, loading } = useWatchlist();
  const { currentUser } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filterTabs = [
    { key: "All", label: "All Titles", icon: Layers },
    { key: "Watching", label: "Watching", icon: PlayCircle },
    { key: "Completed", label: "Completed", icon: CheckCircle },
    { key: "Plan to Watch", label: "Plan to Watch", icon: Bookmark },
    { key: "On-Hold", label: "On-Hold", icon: PauseCircle },
    { key: "Dropped", label: "Dropped", icon: XCircle },
  ];

  const counts = useMemo(() => {
    const map = {
      All: watchlist.length,
      Watching: 0,
      Completed: 0,
      "Plan to Watch": 0,
      "On-Hold": 0,
      Dropped: 0,
    };
    watchlist.forEach((item) => {
      const s = item.status || "Plan to Watch";
      if (map[s] !== undefined) {
        map[s]++;
      }
    });
    return map;
  }, [watchlist]);

  const filteredList = useMemo(() => {
    return watchlist.filter((item) => {
      const matchesStatus =
        selectedFilter === "All" ||
        (item.status || "Plan to Watch") === selectedFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        (item.title &&
          item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.title_english &&
          item.title_english.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [watchlist, selectedFilter, searchQuery]);

  const handleRemove = (animeId) => {
    const item = watchlist.find((i) => i.mal_id === animeId);
    if (item) {
      updateAnimeStatus(item, null);
    }
  };

  if (!currentUser) {
    return (
      <Container>
        <EmptyState>
          <LogIn size={64} color="#ffd700" />
          <h2>Sign in to track your watchlist</h2>
          <p>
            Create lists and track your progress as you follow your favorite
            series.
          </p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <List size={32} color="#ffd700" />
          <h1>My Watchlist</h1>
          <TotalCount>{watchlist.length} Total</TotalCount>
        </HeaderLeft>

        <SearchWrapper>
          <Search size={18} color="rgba(255,255,255,0.4)" />
          <SearchInput
            type="text"
            placeholder="Filter list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchWrapper>
      </Header>

      <TabScrollContainer>
        <TabContainer>
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const count = counts[tab.key] || 0;
            const active = selectedFilter === tab.key;

            return (
              <TabButton
                key={tab.key}
                $active={active}
                onClick={() => setSelectedFilter(tab.key)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <TabBadge $active={active}>{count}</TabBadge>
              </TabButton>
            );
          })}
        </TabContainer>
      </TabScrollContainer>

      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingText>Loading watchlist data...</LoadingText>
        ) : filteredList.length > 0 ? (
          <Grid
            key={selectedFilter + searchQuery}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {filteredList.map((anime) => (
              <motion.div
                key={anime.mal_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <AnimeCard
                  anime={{
                    mal_id: anime.mal_id,
                    title: anime.title,
                    title_english: anime.title_english,
                    images: {
                      jpg: {
                        large_image_url: anime.image_url || anime.image || "",
                        image_url: anime.image_url || anime.image || "",
                      },
                    },
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
            key={`empty-${selectedFilter}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <EmptyState>
              <Bookmark size={56} color="#ffd700" />
              <h2>No titles found in &quot;{selectedFilter}&quot;</h2>
              <p>
                {searchQuery
                  ? "Try changing your search query or filter."
                  : "Add anime from the details page to build your library!"}
              </p>
            </EmptyState>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: 80vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);
  padding-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  h1 {
    font-family: "Staatliches", cursive;
    font-size: 2.8rem;
    color: #ffd700;
    margin: 0;
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
    letter-spacing: 0.05em;
  }
`;

const TotalCount = styled.span`
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.2);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
`;

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  min-width: 240px;

  svg {
    position: absolute;
    left: 1rem;
    pointer-events: none;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.6rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  color: white;
  font-family: "Montserrat", sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const TabScrollContainer = styled.div`
  overflow-x: auto;
  margin-bottom: 2rem;
  padding-bottom: 0.5rem;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.2);
    border-radius: 4px;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  width: max-content;
`;

const TabButton = styled.button`
  background: ${({ $active }) =>
    $active ? "#ffd700" : "rgba(255, 255, 255, 0.04)"};
  color: ${({ $active }) => ($active ? "#1a1a1a" : "rgba(255, 255, 255, 0.8)")};
  border: 1.5px solid
    ${({ $active }) => ($active ? "#ffd700" : "rgba(255, 255, 255, 0.1)")};
  padding: 0.55rem 1.1rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.25s ease;
  white-space: nowrap;

  &:hover {
    border-color: #ffd700;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.15);
  }
`;

const TabBadge = styled.span`
  background: ${({ $active }) =>
    $active ? "#1a1a1a" : "rgba(255, 215, 0, 0.15)"};
  color: ${({ $active }) => ($active ? "#ffd700" : "#ffd700")};
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 800;
`;

const Grid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
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

export default Watchlist;
