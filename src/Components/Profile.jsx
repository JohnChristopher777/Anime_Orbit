import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext.jsx";
import { useFavourites } from "../context/FavouritesContext.jsx";
import { useWatchlist } from "../context/WatchlistContext.jsx";
import { db } from "../firebase/config.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import {
  User,
  Mail,
  Calendar,
  Heart,
  Bookmark,
  CheckCircle,
  LogOut,
  Sparkles,
  Edit3,
  Check,
  Shuffle,
  Camera,
  Image as ImageIcon,
  MessageCircle,
  MessageSquare,
  Gift,
  Cake,
  PartyPopper,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

// Avatar Presets (Iconic Anime Characters)
const AVATAR_PRESETS = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b40-XzygdjQ1y0k9.png",
  },
  {
    id: "zoro",
    name: "Roronoa Zoro",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b62-aT0wzNlq4k3X.png",
  },
  {
    id: "goku",
    name: "Son Goku",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b246-DqJz0vW6eJkF.png",
  },
  {
    id: "naruto",
    name: "Naruto Uzumaki",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b17-7TaDLjC3x1mF.png",
  },
  {
    id: "gojo",
    name: "Gojo Satoru",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b127691-QZzN2F9jGq2A.png",
  },
  {
    id: "tanjiro",
    name: "Tanjiro Kamado",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b126071-G7u7kY6rC4kU.png",
  },
  {
    id: "nezuko",
    name: "Nezuko Kamado",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b126072-VdF7c5z6fJqM.png",
  },
  {
    id: "levi",
    name: "Levi Ackerman",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b45627-2cQZf7rXJm2q.png",
  },
  {
    id: "anya",
    name: "Anya Forger",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b138100-qPz1gYk0L1mA.png",
  },
  {
    id: "sukuna",
    name: "Ryomen Sukuna",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b138558-y0tG6kU7w1pA.png",
  },
  {
    id: "edward",
    name: "Edward Elric",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b11-yT7vN0pQ8k1m.png",
  },
  {
    id: "saitama",
    name: "Saitama",
    url: "https://s4.anilist.co/file/anilistcdn/character/large/b73935-7KkX0vW8eJ1m.png",
  },
];

// Banner Presets (Anime Scenery & Art)
const BANNER_PRESETS = [
  {
    id: "cyberpunk",
    name: "Cyberpunk Tokyo",
    url: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "fuji_sakura",
    name: "Mount Fuji Sakura",
    url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "sunset_ocean",
    name: "Sunset Ocean Voyage",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "night_sky",
    name: "Starry Anime Night",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "autumn_kyoto",
    name: "Kyoto Autumn Leaves",
    url: "https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=1600&auto=format&fit=crop",
  },
];

// Character Birthday Greetings
const BIRTHDAY_CHARACTERS = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    anime: "One Piece",
    avatar: "https://s4.anilist.co/file/anilistcdn/character/large/b40-XzygdjQ1y0k9.png",
    wish: "Happy Birthday! Today is your day to feast like the Pirate King and set sail for your biggest adventures!",
  },
  {
    id: "goku",
    name: "Son Goku",
    anime: "Dragon Ball Z",
    avatar: "https://s4.anilist.co/file/anilistcdn/character/large/b246-DqJz0vW6eJkF.png",
    wish: "Hey, it's your birthday! Let's eat a mountain of food, train hard, and become even stronger this year!",
  },
  {
    id: "gojo",
    name: "Gojo Satoru",
    anime: "Jujutsu Kaisen",
    avatar: "https://s4.anilist.co/file/anilistcdn/character/large/b127691-QZzN2F9jGq2A.png",
    wish: "Happy Birthday! Throughout Heaven and Earth, you alone are the honored one today. Enjoy your day!",
  },
  {
    id: "naruto",
    name: "Naruto Uzumaki",
    anime: "Naruto Shippuden",
    avatar: "https://s4.anilist.co/file/anilistcdn/character/large/b17-7TaDLjC3x1mF.png",
    wish: "Happy Birthday, dattebayo! Never give up on your dreams and always walk your own ninja way!",
  },
  {
    id: "nezuko",
    name: "Nezuko Kamado",
    anime: "Demon Slayer",
    avatar: "https://s4.anilist.co/file/anilistcdn/character/large/b126072-VdF7c5z6fJqM.png",
    wish: "Mmh mmh! (Happy Birthday! Wishing you endless warmth, bright smiles, and protection on your journey!)",
  },
  {
    id: "anya",
    name: "Anya Forger",
    anime: "Spy x Family",
    avatar: "https://s4.anilist.co/file/anilistcdn/character/large/b138100-qPz1gYk0L1mA.png",
    wish: "Waku Waku! Happy Birthday! Anya wants to share crunchy peanuts with you to celebrate your special day!",
  },
  {
    id: "levi",
    name: "Levi Ackerman",
    anime: "Attack on Titan",
    avatar: "https://s4.anilist.co/file/anilistcdn/character/large/b45627-2cQZf7rXJm2q.png",
    wish: "Happy Birthday. Don't make a mess, stay sharp, and keep fighting for what matters most.",
  },
];

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const { favourites } = useFavourites();
  const { watchlist, watched } = useWatchlist();
  const navigate = useNavigate();

  // Profile Form States
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [birthdayDay, setBirthdayDay] = useState("");
  const [birthdayCharId, setBirthdayCharId] = useState("luffy");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewBirthday, setPreviewBirthday] = useState(false);

  // Load profile from Firestore
  useEffect(() => {
    if (!currentUser) return;

    setDisplayName(currentUser.displayName || "");
    setAvatarUrl(currentUser.photoURL || AVATAR_PRESETS[0].url);

    const loadProfileData = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.bio) setBio(data.bio);
          if (data.bannerUrl) setBannerUrl(data.bannerUrl);
          if (data.birthdayMonth) setBirthdayMonth(data.birthdayMonth);
          if (data.birthdayDay) setBirthdayDay(data.birthdayDay);
          if (data.birthdayCharId) setBirthdayCharId(data.birthdayCharId);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };

    loadProfileData();
  }, [currentUser]);

  // Generate Anonymous AniOrb ID
  const generateAnonymousId = () => {
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    const newId = `AniOrb${randomNum}`;
    setDisplayName(newId);
    toast.info(`Generated Nickname: ${newId}`);
  };

  // Check if today is the user's birthday
  const today = new Date();
  const currentMonthName = today.toLocaleString("en-US", { month: "long" });
  const currentDayNum = today.getDate().toString();
  const isBirthdayToday =
    birthdayMonth &&
    birthdayDay &&
    birthdayMonth.toLowerCase() === currentMonthName.toLowerCase() &&
    birthdayDay === currentDayNum;

  const showBirthdayBanner = isBirthdayToday || previewBirthday;
  const selectedBirthdayChar =
    BIRTHDAY_CHARACTERS.find((c) => c.id === birthdayCharId) ||
    BIRTHDAY_CHARACTERS[0];

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(currentUser, {
        displayName: displayName.trim(),
        photoURL: avatarUrl,
      });

      // 2. Persist full profile to Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userDocRef,
        {
          displayName: displayName.trim(),
          photoURL: avatarUrl,
          bannerUrl: bannerUrl || BANNER_PRESETS[0].url,
          bio: bio.trim(),
          birthdayMonth,
          birthdayDay,
          birthdayCharId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getJoinedDate = () => {
    if (!currentUser?.metadata?.creationTime) return "N/A";
    const date = new Date(currentUser.metadata.creationTime);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!currentUser) {
    return (
      <Container
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <EmptyCard>
          <User size={64} color="#ffd700" style={{ margin: "0 auto" }} />
          <h2>Sign in to view your profile</h2>
          <ActionButton
            onClick={() => navigate("/")}
            style={{
              borderColor: "#ffd700",
              color: "#ffd700",
              background: "rgba(255,215,0,0.1)",
            }}
          >
            Go Home
          </ActionButton>
        </EmptyCard>
      </Container>
    );
  }

  return (
    <Container>
      {/* Birthday Character Wish Banner */}
      <AnimatePresence>
        {showBirthdayBanner && (
          <BirthdayBanner
            as={motion.div}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <BirthdayGlow />
            <BirthdayContent>
              <CharacterAvatarWrapper>
                <img
                  src={selectedBirthdayChar.avatar}
                  alt={selectedBirthdayChar.name}
                />
                <PartyBadge>
                  <Cake size={16} color="#1a1a1a" />
                </PartyBadge>
              </CharacterAvatarWrapper>

              <BirthdayDetails>
                <BirthdayHeaderRow>
                  <BirthdayTag>
                    <PartyPopper size={16} />
                    <span>Special Birthday Celebration</span>
                  </BirthdayTag>
                  {previewBirthday && !isBirthdayToday && (
                    <PreviewBadge>Preview Mode</PreviewBadge>
                  )}
                </BirthdayHeaderRow>
                <h3>
                  {selectedBirthdayChar.name} wishes you a Happy Birthday,{" "}
                  <span className="name-highlight">
                    {displayName || "Anime Star"}
                  </span>
                  !
                </h3>
                <p className="wish-quote">
                  &ldquo;{selectedBirthdayChar.wish}&rdquo;
                </p>
                <span className="character-sub">
                  From {selectedBirthdayChar.anime}
                </span>
              </BirthdayDetails>
            </BirthdayContent>
          </BirthdayBanner>
        )}
      </AnimatePresence>

      <ProfileCard>
        {/* Cinematic Header Banner */}
        <BannerWrapper
          style={{
            backgroundImage: `url(${bannerUrl || BANNER_PRESETS[0].url})`,
          }}
        >
          <BannerOverlay />
          <BannerActionGroup>
            {!isEditing ? (
              <EditProfileBtn onClick={() => setIsEditing(true)}>
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </EditProfileBtn>
            ) : (
              <EditProfileBtn
                className="cancel"
                onClick={() => setIsEditing(false)}
              >
                <span>Cancel</span>
              </EditProfileBtn>
            )}
          </BannerActionGroup>
        </BannerWrapper>

        {/* User Identity Section */}
        <ProfileHeaderSection>
          <AvatarWrapper>
            <AvatarImage
              src={avatarUrl || currentUser.photoURL || AVATAR_PRESETS[0].url}
              alt="Avatar"
            />
          </AvatarWrapper>

          <IdentityDetails>
            <div className="title-row">
              <h2>{displayName || currentUser.displayName || "AniOrb User"}</h2>
              <IdBadge>
                {displayName.startsWith("AniOrb")
                  ? "Anonymous ID"
                  : "Verified Member"}
              </IdBadge>
            </div>

            <BioText>
              {bio ||
                "No bio yet. Click Edit Profile to set up your crunchyroll-style bio, character avatar, and birthday!"}
            </BioText>

            <MetaInfoRow>
              <InfoItem>
                <Mail size={15} />
                <span>{currentUser.email}</span>
              </InfoItem>
              <InfoItem>
                <Calendar size={15} />
                <span>Joined {getJoinedDate()}</span>
              </InfoItem>
              {birthdayMonth && birthdayDay && (
                <InfoItem className="birthday">
                  <Gift size={15} color="#ffd700" />
                  <span>
                    Birthday: {birthdayMonth} {birthdayDay}
                  </span>
                </InfoItem>
              )}
            </MetaInfoRow>
          </IdentityDetails>
        </ProfileHeaderSection>

        {/* Profile Settings / Edit Form */}
        <AnimatePresence>
          {isEditing && (
            <EditForm
              as={motion.form}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveProfile}
            >
              <SectionHeading>
                <Edit3 size={20} color="#ffd700" />
                <span>Customize Profile Settings</span>
              </SectionHeading>

              {/* Display Name & Anonymous ID Generator */}
              <FormGroup>
                <FormLabel>Username / Display Name</FormLabel>
                <InputGroupRow>
                  <TextInput
                    type="text"
                    placeholder="Enter your username"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                  <GenerateIdButton
                    type="button"
                    onClick={generateAnonymousId}
                    title="Generate Anonymous AniOrb ID"
                  >
                    <Shuffle size={16} />
                    <span>Generate AniOrb ID</span>
                  </GenerateIdButton>
                </InputGroupRow>
              </FormGroup>

              {/* Bio Field */}
              <FormGroup>
                <FormLabel>Profile Bio</FormLabel>
                <TextArea
                  placeholder="Share a bit about yourself, your favorite anime series, or hobbies..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                />
              </FormGroup>

              {/* Avatar Preset Selector */}
              <FormGroup>
                <FormLabel>Choose Character Avatar</FormLabel>
                <PresetGrid>
                  {AVATAR_PRESETS.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      $active={avatarUrl === preset.url}
                      onClick={() => setAvatarUrl(preset.url)}
                      type="button"
                    >
                      <img src={preset.url} alt={preset.name} />
                      <span>{preset.name.split(" ")[0]}</span>
                    </PresetCard>
                  ))}
                </PresetGrid>
                <CustomUrlInputWrapper>
                  <Camera size={16} color="rgba(255,255,255,0.4)" />
                  <CustomUrlInput
                    type="url"
                    placeholder="Or paste custom avatar image URL..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </CustomUrlInputWrapper>
              </FormGroup>

              {/* Banner Preset Selector */}
              <FormGroup>
                <FormLabel>Choose Profile Banner</FormLabel>
                <BannerPresetGrid>
                  {BANNER_PRESETS.map((preset) => (
                    <BannerPresetCard
                      key={preset.id}
                      $active={bannerUrl === preset.url}
                      onClick={() => setBannerUrl(preset.url)}
                      type="button"
                      style={{ backgroundImage: `url(${preset.url})` }}
                    >
                      <span>{preset.name}</span>
                    </BannerPresetCard>
                  ))}
                </BannerPresetGrid>
                <CustomUrlInputWrapper>
                  <ImageIcon size={16} color="rgba(255,255,255,0.4)" />
                  <CustomUrlInput
                    type="url"
                    placeholder="Or paste custom banner image URL..."
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                  />
                </CustomUrlInputWrapper>
              </FormGroup>

              {/* Birthday & Celebrating Character Selector */}
              <FormGroup>
                <FormLabel>Birthday & Celebrating Anime Character</FormLabel>
                <BirthdaySelectRow>
                  <Select
                    value={birthdayMonth}
                    onChange={(e) => setBirthdayMonth(e.target.value)}
                  >
                    <option value="">Month</option>
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={birthdayDay}
                    onChange={(e) => setBirthdayDay(e.target.value)}
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={birthdayCharId}
                    onChange={(e) => setBirthdayCharId(e.target.value)}
                  >
                    {BIRTHDAY_CHARACTERS.map((char) => (
                      <option key={char.id} value={char.id}>
                        {char.name} ({char.anime})
                      </option>
                    ))}
                  </Select>
                </BirthdaySelectRow>

                <PreviewBirthdayBtn
                  type="button"
                  onClick={() => setPreviewBirthday(!previewBirthday)}
                >
                  <Sparkles size={16} />
                  <span>
                    {previewBirthday ? "Hide Birthday Wish Preview" : "Preview Character Birthday Wish"}
                  </span>
                </PreviewBirthdayBtn>
              </FormGroup>

              {/* Submit / Save Button */}
              <SaveButton type="submit" disabled={saving}>
                <Save size={18} />
                <span>{saving ? "Saving Changes..." : "Save Profile Settings"}</span>
              </SaveButton>
            </EditForm>
          )}
        </AnimatePresence>

        {/* Stats Grid & Quick Links */}
        <StatsGrid>
          <StatCard
            onClick={() => navigate("/favourites")}
            style={{ cursor: "pointer" }}
          >
            <div className="value">{favourites.length}</div>
            <div className="label">
              <Heart size={16} fill="#ff4d4d" color="#ff4d4d" />
              <span>Favorites</span>
            </div>
          </StatCard>

          <StatCard
            onClick={() => navigate("/watchlist")}
            style={{ cursor: "pointer" }}
          >
            <div className="value">{watchlist.length}</div>
            <div className="label">
              <Bookmark size={16} fill="#ffd700" color="#ffd700" />
              <span>Watchlist</span>
            </div>
          </StatCard>

          <StatCard
            onClick={() => navigate("/watchlist")}
            style={{ cursor: "pointer" }}
          >
            <div className="value">{watched.length}</div>
            <div className="label">
              <CheckCircle size={16} color="#27AE60" />
              <span>Watched</span>
            </div>
          </StatCard>

          <StatCard
            onClick={() => navigate("/my-reviews")}
            style={{ cursor: "pointer" }}
          >
            <div className="value">
              <MessageCircle size={24} color="#ffd700" />
            </div>
            <div className="label">
              <span>My Reviews</span>
            </div>
          </StatCard>

          <StatCard
            onClick={() => navigate("/my-comments")}
            style={{ cursor: "pointer" }}
          >
            <div className="value">
              <MessageSquare size={24} color="#ffd700" />
            </div>
            <div className="label">
              <span>My Comments</span>
            </div>
          </StatCard>
        </StatsGrid>

        <FooterRow>
          <LogoutButton onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </LogoutButton>
        </FooterRow>
      </ProfileCard>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1050px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ProfileCard = styled.div`
  background: linear-gradient(145deg, #222, #141414);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const BannerWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 220px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 1.5rem;
`;

const BannerOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(20, 20, 20, 0.8) 100%
  );
`;

const BannerActionGroup = styled.div`
  position: relative;
  z-index: 2;
`;

const EditProfileBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border: 1.5px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #ffd700;
    color: #1a1a1a;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
  }

  &.cancel {
    background: rgba(255, 77, 77, 0.2);
    border-color: #ff4d4d;
    color: #ff4d4d;

    &:hover {
      background: #ff4d4d;
      color: white;
    }
  }
`;

const ProfileHeaderSection = styled.div`
  display: flex;
  gap: 2rem;
  padding: 0 2rem 2rem;
  margin-top: -60px;
  position: relative;
  z-index: 3;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: -50px;
    padding: 0 1.5rem 1.5rem;
  }
`;

const AvatarWrapper = styled.div`
  width: 130px;
  height: 130px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #ffd700;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
  background: #1a1a1a;
  flex-shrink: 0;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const IdentityDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1.5rem;

  @media (max-width: 768px) {
    padding-top: 0;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      justify-content: center;
    }

    h2 {
      font-family: "Montserrat", sans-serif;
      font-size: 2rem;
      font-weight: 800;
      color: white;
      margin: 0;
    }
  }
`;

const IdBadge = styled.span`
  background: rgba(255, 215, 0, 0.12);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.25rem 0.7rem;
  border-radius: 15px;
`;

const BioText = styled.p`
  font-family: "Inter", "Noto Sans JP", sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin: 0;
  max-width: 650px;
`;

const MetaInfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;

  @media (max-width: 768px) {
    justify-content: center;
    gap: 1rem;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.55);

  svg {
    color: #ffd700;
  }

  &.birthday {
    color: #ffd700;
    font-weight: 600;
  }
`;

const EditForm = styled.form`
  background: rgba(0, 0, 0, 0.35);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: "Montserrat", sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffd700;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FormLabel = styled.label`
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InputGroupRow = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const TextInput = styled.input`
  flex: 1;
  padding: 0.8rem 1.2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: white;
  font-family: "Montserrat", sans-serif;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.8rem 1.2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: white;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  min-height: 90px;
  resize: vertical;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
  }
`;

const GenerateIdButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 215, 0, 0.12);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: #ffd700;
    color: #1a1a1a;
    transform: translateY(-2px);
  }
`;

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.75rem;
`;

const PresetCard = styled.button`
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid
    ${({ $active }) => ($active ? "#ffd700" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;

  img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
  }

  span {
    font-family: "Montserrat", sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: ${({ $active }) => ($active ? "#ffd700" : "rgba(255,255,255,0.7)")};
  }

  &:hover {
    border-color: #ffd700;
    transform: translateY(-3px);
  }
`;

const BannerPresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
`;

const BannerPresetCard = styled.button`
  height: 70px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  border: 2px solid
    ${({ $active }) => ($active ? "#ffd700" : "rgba(255, 255, 255, 0.1)")};
  display: flex;
  align-items: flex-end;
  padding: 0.5rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
  }

  span {
    position: relative;
    z-index: 2;
    font-family: "Montserrat", sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
  }

  &:hover {
    border-color: #ffd700;
    transform: translateY(-2px);
  }
`;

const CustomUrlInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 0.5rem;

  svg {
    position: absolute;
    left: 1rem;
    pointer-events: none;
  }
`;

const CustomUrlInput = styled.input`
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.6rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  outline: none;

  &:focus {
    border-color: #ffd700;
  }
`;

const BirthdaySelectRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Select = styled.select`
  padding: 0.8rem 1rem;
  background: #252525;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: white;
  font-family: "Montserrat", sans-serif;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: #ffd700;
  }
`;

const PreviewBirthdayBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(255, 215, 0, 0.08);
  border: 1px dashed rgba(255, 215, 0, 0.3);
  color: #ffd700;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;

  &:hover {
    background: rgba(255, 215, 0, 0.15);
    border-color: #ffd700;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffea00 100%);
  color: #1a1a1a;
  border: none;
  padding: 0.9rem 2rem;
  border-radius: 25px;
  font-family: "Montserrat", sans-serif;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr 1fr;
    padding: 1.5rem;
  }
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 1.25rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.03);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }

  .value {
    font-size: 1.8rem;
    font-weight: 800;
    color: #ffd700;
    font-family: "Staatliches", cursive;
    letter-spacing: 0.05em;
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .label {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    font-family: "Montserrat", sans-serif;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
`;

const FooterRow = styled.div`
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: flex-end;
`;

const LogoutButton = styled.button`
  background: rgba(255, 77, 77, 0.08);
  border: 1.5px solid rgba(255, 77, 77, 0.3);
  color: #ff4d4d;
  padding: 0.6rem 1.4rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: #ff4d4d;
    color: white;
    box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3);
    transform: translateY(-2px);
  }
`;

// Birthday Banner Styles
const BirthdayBanner = styled.div`
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(40, 30, 10, 0.95),
    rgba(25, 20, 10, 0.98)
  );
  border: 2px solid #ffd700;
  border-radius: 20px;
  padding: 2rem;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(255, 215, 0, 0.2);
`;

const BirthdayGlow = styled.div`
  position: absolute;
  top: -50px;
  right: -50px;
  width: 250px;
  height: 250px;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.25) 0%,
    transparent 70%
  );
  pointer-events: none;
`;

const BirthdayContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
  }
`;

const CharacterAvatarWrapper = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #ffd700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
  background: #111;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PartyBadge = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  background: #ffd700;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BirthdayDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  h3 {
    font-family: "Montserrat", sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    color: white;
    margin: 0;

    .name-highlight {
      color: #ffd700;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
    }
  }

  .wish-quote {
    font-family: "Inter", "Noto Sans JP", sans-serif;
    font-size: 1.05rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    margin: 0.2rem 0;
    font-style: italic;
  }

  .character-sub {
    font-family: "Montserrat", sans-serif;
    font-size: 0.8rem;
    color: #ffd700;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const BirthdayHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    justify-content: center;
  }
`;

const BirthdayTag = styled.span`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid #ffd700;
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const PreviewBadge = styled.span`
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  font-family: "Montserrat", sans-serif;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
`;

const EmptyCard = styled.div`
  background: #1e1e1e;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 450px;
  width: 100%;

  h2 {
    font-family: "Montserrat", sans-serif;
    color: white;
  }
`;

const ActionButton = styled.button`
  padding: 0.7rem 1.5rem;
  border-radius: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
`;

export default Profile;
