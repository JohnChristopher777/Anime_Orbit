import React from "react";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext.jsx";
import { useFavourites } from "../context/FavouritesContext.jsx";
import { useWatchlist } from "../context/WatchlistContext.jsx";
import { User, Mail, Calendar, Heart, Bookmark, CheckCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 1rem;
  min-height: 80vh;
`;

const ProfileCard = styled.div`
  background: linear-gradient(145deg, #252525, #151515);
  border: 2px solid #333;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, #ffd700, #ffea00);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
  }
`;

const AvatarWrapper = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffd700;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  h2 {
    font-family: "Montserrat", sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: white;
    margin: 0;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;

  svg {
    color: #ffd700;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem 0;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.02);
  }

  .value {
    font-size: 2.2rem;
    font-weight: 700;
    color: #ffd700;
    font-family: "Staatliches", cursive;
    letter-spacing: 0.05em;
  }

  .label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    font-family: "Montserrat", sans-serif;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
`;

const LogoutButton = styled.button`
  align-self: flex-start;
  background: rgba(255, 77, 77, 0.1);
  border: 2px solid rgba(255, 77, 77, 0.3);
  color: #ff4d4d;
  padding: 0.7rem 1.5rem;
  border-radius: 25px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: #ff4d4d;
    color: white;
    box-shadow: 0 4px 12px rgba(255, 77, 77, 0.3);
  }

  @media (max-width: 640px) {
    align-self: center;
    width: 100%;
    justify-content: center;
  }
`;

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const { favourites } = useFavourites();
  const { watchlist, watched } = useWatchlist();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <Container style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ProfileCard style={{ textAlign: 'center', width: '100%', maxWidth: '500px' }}>
          <User size={64} color="#ffd700" style={{ margin: '0 auto' }} />
          <h2>Sign in to view your profile</h2>
          <LogoutButton onClick={() => navigate("/")} style={{ alignSelf: 'center', borderColor: '#ffd700', color: '#ffd700', background: 'rgba(255,215,0,0.1)' }}>
            Go Home
          </LogoutButton>
        </ProfileCard>
      </Container>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getJoinedDate = () => {
    if (!currentUser.metadata?.creationTime) return "N/A";
    const date = new Date(currentUser.metadata.creationTime);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Container>
      <ProfileCard>
        <UserInfo>
          <AvatarWrapper>
            {currentUser.photoURL ? (
              <AvatarImage src={currentUser.photoURL} alt="Profile" />
            ) : (
              <User size={60} />
            )}
          </AvatarWrapper>
          <Details>
            <h2>{currentUser.displayName || "Anime Enthusiast"}</h2>
            <InfoRow>
              <Mail size={16} />
              <span>{currentUser.email}</span>
            </InfoRow>
            <InfoRow>
              <Calendar size={16} />
              <span>Member since {getJoinedDate()}</span>
            </InfoRow>
          </Details>
        </UserInfo>

        <StatsGrid>
          <StatCard onClick={() => navigate("/favourites")} style={{ cursor: 'pointer' }}>
            <div className="value">{favourites.length}</div>
            <div className="label">
              <Heart size={16} fill="#ff4d4d" color="#ff4d4d" />
              <span>Favorites</span>
            </div>
          </StatCard>
          <StatCard onClick={() => navigate("/watchlist")} style={{ cursor: 'pointer' }}>
            <div className="value">{watchlist.length}</div>
            <div className="label">
              <Bookmark size={16} fill="#ffd700" color="#ffd700" />
              <span>Watchlist</span>
            </div>
          </StatCard>
          <StatCard onClick={() => navigate("/watchlist")} style={{ cursor: 'pointer' }}>
            <div className="value">{watched.length}</div>
            <div className="label">
              <CheckCircle size={16} color="#27AE60" />
              <span>Watched</span>
            </div>
          </StatCard>
        </StatsGrid>

        <LogoutButton onClick={handleLogout}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </LogoutButton>
      </ProfileCard>
    </Container>
  );
};

export default Profile;
