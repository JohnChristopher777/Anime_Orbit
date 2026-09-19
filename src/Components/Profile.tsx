import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavourites } from "../context/FavouritesContext";
import { useWatchlist } from "../context/WatchlistContext";
import { db } from "../firebase/config";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updateProfile } from "firebase/auth";
import {
  User,
  Heart,
  List,
  Sparkles,
  Save,
  LogIn,
  LogOut,
  Edit3,
  X,
  Tag,
  Cake,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Upload,
  Camera,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import AuthModal from "./AuthModal";
import SEO from "./SEO";
import Footer from "./Footer";
import AppDropdown from "./AppDropdown";
import { getAnimeListByIds } from "../services/anilist";

const AVATAR_PRESETS = [
  "/avatars/1.png",
  "/avatars/2.png",
  "/avatars/3.png",
  "/avatars/4.png",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80",
];

const BANNER_PRESETS = [
  "/banners/1.jpg",
  "/banners/2.jpg",
  "/banners/3.jpg",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
];

export const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { favourites } = useFavourites();
  const { watchlist } = useWatchlist();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState("");
  const [userIdError, setUserIdError] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [bannerUrl, setBannerUrl] = useState(BANNER_PRESETS[3]);
  const [favoriteGenre, setFavoriteGenre] = useState("Action");
  const [birthDate, setBirthDate] = useState("");
  const [allowMatureContent, setAllowMatureContent] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [genreBackfill, setGenreBackfill] = useState<Record<number, string[]>>({});

  // Deletion States
  const [deletionScheduled, setDeletionScheduled] = useState(false);
  const [scheduledDeletionDate, setScheduledDeletionDate] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Custom File Upload Handlers for Local Avatar & Banner
  const handleAvatarFileUpload = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileUpload = (file: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Banner image must be under 8MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBannerUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditSection = () => {
    setIsEditing(true);
    setTimeout(() => {
      document.getElementById("edit-profile-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleToggleEdit = () => {
    const next = !isEditing;
    setIsEditing(next);
    if (next) {
      setTimeout(() => {
        document.getElementById("edit-profile-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    setDisplayName((currentUser.displayName || "").slice(0, 15));
    setAvatarUrl(currentUser.photoURL || AVATAR_PRESETS[0]);

    const fetchUserProfile = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.displayName) setDisplayName(data.displayName.slice(0, 15));
          if (data.userId) setUserId(data.userId);
          if (data.bio) setBio(data.bio);
          if (data.favoriteGenre) setFavoriteGenre(data.favoriteGenre);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
          if (data.bannerUrl) setBannerUrl(data.bannerUrl);
          if (data.birthDate) setBirthDate(data.birthDate);
          if (typeof data.allowMatureContent === "boolean") {
            setAllowMatureContent(data.allowMatureContent);
          }

          if (data.deletionScheduled) {
            await updateDoc(userDocRef, {
              deletionScheduled: false,
              scheduledDeletionDate: null,
              deletionStatus: "cancelled_by_login",
            });
            setDeletionScheduled(false);
            setScheduledDeletionDate(null);
            toast.info("Welcome back! Your scheduled account deletion has been cancelled.");
          } else if (data.scheduledDeletionDate) {
            setDeletionScheduled(true);
            setScheduledDeletionDate(data.scheduledDeletionDate);
          }
        }
      } catch {
        // Handled
      }
    };
    fetchUserProfile();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const missingIds = [...watchlist, ...favourites]
      .filter((item) => !(item.genres || []).length && !genreBackfill[item.mal_id])
      .map((item) => Number(item.mal_id))
      .filter(Boolean);
    if (!missingIds.length) return;
    let active = true;
    getAnimeListByIds([...new Set(missingIds)]).then((titles: any[]) => {
      if (!active) return;
      setGenreBackfill((current) => {
        const next = { ...current };
        missingIds.forEach((mediaId) => { if (!next[mediaId]) next[mediaId] = []; });
        titles.forEach((title) => {
          next[Number(title.mal_id)] = (title.genres || [])
            .map((genre: any) => typeof genre === "string" ? genre : genre?.name)
            .filter(Boolean);
        });
        return next;
      });
    });
    return () => { active = false; };
  }, [currentUser, watchlist, favourites, genreBackfill]);

  // Validate User ID: 15 chars max, at least 1 number, at least 1 uppercase letter, allowed: . @ - _
  const validateUserId = (id: string): string | null => {
    if (!id || !id.trim()) return null;
    if (id.length > 15) return "User ID must be 15 characters or less";
    if (!/\d/.test(id)) return "User ID must contain at least 1 number";
    if (!/[A-Z]/.test(id)) return "User ID must contain at least 1 uppercase letter";
    if (!/^[a-zA-Z0-9.@\-_]+$/.test(id)) return "Allowed symbols are: . @ - _ only";
    return null;
  };

  const handleUserIdChange = (val: string) => {
    const trimmed = val.slice(0, 15);
    setUserId(trimmed);
    const err = validateUserId(trimmed);
    setUserIdError(err || "");
  };

  // Calculate age from birthDate
  const calculatedAge = useMemo(() => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [birthDate]);

  const joinedDate = useMemo(() => {
    if (!currentUser?.metadata?.creationTime) return "Recently";
    try {
      return new Date(currentUser.metadata.creationTime).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  }, [currentUser]);

  const formattedBirthDate = useMemo(() => {
    if (!birthDate) return null;
    try {
      const parts = birthDate.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
      }
      return birthDate;
    } catch {
      return birthDate;
    }
  }, [birthDate]);

  const isBirthdayToday = useMemo(() => {
    if (!birthDate) return false;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return false;
    const today = new Date();
    return birth.getDate() === today.getDate() && birth.getMonth() === today.getMonth();
  }, [birthDate]);

  const isAdult = calculatedAge !== null && calculatedAge >= 18;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (userId) {
      const err = validateUserId(userId);
      if (err) {
        setUserIdError(err);
        toast.error(err);
        return;
      }
    }

    setSaving(true);
    try {
      const finalMatureSetting = isAdult ? allowMatureContent : false;

      try {
        await updateProfile(currentUser, {
          displayName: displayName.slice(0, 15),
          photoURL: avatarUrl,
        });
      } catch {
        // Handled
      }

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          displayName: displayName.slice(0, 15),
          userId: userId.trim(),
          bio,
          avatarUrl,
          bannerUrl,
          favoriteGenre,
          birthDate,
          allowMatureContent: finalMatureSetting,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      window.dispatchEvent(
        new CustomEvent("orbit_avatar_updated", { detail: { avatarUrl } })
      );

      toast.success("Profile saved successfully!");
      setIsEditing(false);
    } catch {
      toast.error("Unable to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully.");
      navigate("/");
    } catch {
      toast.error("Failed to log out");
    }
  };

  const handleScheduleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.email) return;
    setDeleting(true);

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
      await reauthenticateWithCredential(currentUser, credential);

      const destructDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          deletionScheduled: true,
          scheduledDeletionDate: destructDate,
          deletionStatus: "pending_destruction",
        },
        { merge: true }
      );

      setDeletionScheduled(true);
      setScheduledDeletionDate(destructDate);
      setDeleteModalOpen(false);
      setDeletePassword("");
      toast.warning("Account deletion scheduled. You have 30 days to log in to cancel!");
    } catch (err: any) {
      toast.error("Failed to verify credentials: " + (err.message || "Error"));
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!currentUser) return;
    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          deletionScheduled: false,
          scheduledDeletionDate: null,
          deletionStatus: "cancelled_manually",
        },
        { merge: true }
      );
      setDeletionScheduled(false);
      setScheduledDeletionDate(null);
      toast.success("Scheduled account deletion has been cancelled.");
    } catch {
      toast.error("Failed to cancel scheduled deletion.");
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-4">
        <SEO
          title="User Profile - Anime Orbit"
          description="Manage your anime profile, account settings, watchlist, and personalized tier list on Anime Orbit."
          keywords="anime profile, anime watchlist, anime account, Anime Orbit"
          url="https://animeorbit.web.app/profile"
        />
        <div className="bg-[#12121c]/90 border border-white/10 p-8 rounded-3xl text-center max-w-md w-full backdrop-blur-xl shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/30 flex items-center justify-center text-[#ffd700] mx-auto">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black font-montserrat text-white mb-2">
              Sign In to Your Orbit
            </h1>
            <p className="text-neutral-400 text-sm">
              Sign in to manage your profile, favorites, and watchlist.
            </p>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full py-3 rounded-full bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            <span>Sign In / Register</span>
          </button>
        </div>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  const watchingCount = watchlist.filter((item) => (item.status || "Plan to Watch") === "Watching").length;
  const completedCount = watchlist.filter((item) => (item.status || "Plan to Watch") === "Completed").length;
  const planToWatchCount = watchlist.filter((item) => (item.status || "Plan to Watch") === "Plan to Watch").length;
  const caughtUpCount = watchlist.filter((item) => item.status === "Caught Up").length;
  const pausedCount = watchlist.filter((item) => item.status === "On-Hold" || item.status === "Dropped").length;
  const completionRate = watchlist.length ? Math.round((completedCount / watchlist.length) * 100) : 0;
  const genreCounts = [...watchlist, ...favourites].reduce<Record<string, number>>((counts, item: any) => {
    const genres = (item.genres || []).length ? item.genres : genreBackfill[item.mal_id] || [];
    genres.forEach((rawGenre: any) => {
      const genre = typeof rawGenre === "string" ? rawGenre : rawGenre?.name;
      if (genre) counts[genre] = (counts[genre] || 0) + 1;
    });
    return counts;
  }, {});
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxGenreCount = topGenres[0]?.[1] || 1;
  const totalEpisodesWatched = watchlist.reduce((total, item) => {
    const logged = Math.max(0, Number(item.progress || 0));
    if (item.status === "Completed" && item.episodes) return total + Math.max(logged, Number(item.episodes));
    return total + logged;
  }, 0);
  const watchMinutes = watchlist.reduce((total, item) => {
    const logged = Math.max(0, Number(item.progress || 0));
    const completed = item.status === "Completed";
    const isMovie = String(item.type || "").toLowerCase() === "movie";
    if (isMovie) return total + (completed || logged > 0 ? 120 : 0);
    return total + (completed && item.episodes ? Math.max(logged, Number(item.episodes)) : logged) * 24;
  }, 0);
  const interestAxes = Array.from({ length: 5 }, (_, index) => topGenres[index] || [`Taste ${index + 1}`, 0] as [string, number]);
  const radarPoints = interestAxes.map(([, count], index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / 5);
    const radius = 42 * (Number(count) / maxGenreCount);
    return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
  }).join(" ");
  const radarGridPoints = (scale: number) => interestAxes.map((_, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / 5);
    return `${50 + Math.cos(angle) * 42 * scale},${50 + Math.sin(angle) * 42 * scale}`;
  }).join(" ");
  const identityGenre = topGenres[0]?.[0] || favoriteGenre || "Anime";

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title={`${displayName || "User"}'s Orbit Profile - Anime Orbit`}
        description={`Explore ${displayName || "User"}'s anime watchlist, favorite tier list, and activity on Anime Orbit.`}
        keywords="anime profile, anime favorites, user watchlist, Anime Orbit"
        url="https://animeorbit.web.app/profile"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-16 space-y-6 flex-1 w-full">
        {/* Birthday Banner Greeting */}
        {isBirthdayToday && (
          <div className="relative bg-[#18181d] border border-[#ffd700]/35 rounded-2xl p-5 sm:p-6 text-center shadow-lg">
            <Cake size={44} className="mx-auto text-[#ffd700] mb-2" />
            <h2 className="text-2xl sm:text-3xl font-black font-montserrat text-white drop-shadow-md">
              Happy birthday, {displayName || "Anime Fan"}
            </h2>
            <p className="text-sm text-neutral-200 mt-2 max-w-lg mx-auto leading-relaxed">
              Wishing you a wonderful year filled with thrilling adventures, unforgettable stories, and great anime moments!
            </p>
          </div>
        )}

        {/* 30-Day Scheduled Deletion Active Warning Banner */}
        {deletionScheduled && scheduledDeletionDate && (
          <div className="relative bg-red-950/55 border border-red-500/60 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <AlertTriangle size={28} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold font-montserrat text-red-200">
                  Account deletion scheduled
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                  Your account and all associated data are scheduled to be deleted on{" "}
                  <span className="font-bold text-white">
                    {new Date(scheduledDeletionDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>{" "}
                  (30-day grace period). You can cancel before that date.
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelDeletion}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-montserrat font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-md flex-shrink-0 cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>Cancel Deletion</span>
            </button>
          </div>
        )}

        {/* Main Profile View Card with Cover Banner */}
        <div className="profile-card relative bg-[#15151a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {/* Custom Header Cover Banner */}
          <div className="profile-cover relative h-36 sm:h-48 w-full overflow-hidden bg-neutral-900">
            <img
              src={bannerUrl || BANNER_PRESETS[3]}
              alt="Profile Cover Banner"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = BANNER_PRESETS[3];
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12121c] via-[#12121c]/40 to-black/30" />
            <button
              onClick={handleOpenEditSection}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white/90 hover:text-white border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-montserrat font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-lg"
            >
              <Camera size={14} className="text-[#ffd700]" />
              <span>Change Cover</span>
            </button>
          </div>

          <div className="relative px-5 sm:px-8 pb-7 pt-0 -mt-12 sm:-mt-16">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                {/* Round Avatar Frame */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#15151a] ring-2 ring-[#ffd700] bg-neutral-900 flex-shrink-0 flex items-center justify-center group">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <User size={52} className="text-[#ffd700]" />
                  )}
                  <button
                    onClick={handleOpenEditSection}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[10px] font-bold gap-1"
                  >
                    <Camera size={18} className="text-[#ffd700]" />
                    <span>Change</span>
                  </button>
                </div>

                <div className="profile-identity-panel space-y-2 min-w-0 sm:pb-2">
                  <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black font-montserrat text-white truncate">
                      {displayName || currentUser.email?.split("@")[0]}
                    </h1>
                    <span className="inline-flex items-center gap-1 bg-[#ffd700]/15 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold font-montserrat px-2.5 py-0.5 rounded-full">
                      <Tag size={10} />
                      {favoriteGenre}
                    </span>

                    {calculatedAge !== null && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold font-montserrat px-2.5 py-0.5 rounded-full border ${
                          isAdult
                            ? "bg-green-500/15 border-green-500/40 text-green-400"
                            : "bg-blue-500/15 border-blue-500/40 text-blue-400"
                        }`}
                      >
                        {calculatedAge} years old
                      </span>
                    )}
                  </div>

                  {/* User ID Tag */}
                  {userId && (
                    <p className="text-xs font-mono font-bold text-[#ffd700]">
                      @{userId}
                    </p>
                  )}

                  <div className="profile-identity-stamp" aria-label="Anime profile identity">
                    <span>Anime Orbit profile</span>
                    <strong>{identityGenre} fan</strong>
                    <small>{completedCount} completed · {Math.round(watchMinutes / 60)} watch hours</small>
                  </div>

                  {/* Joined Date & Email */}
                  <div className="flex items-center gap-3 justify-center sm:justify-start text-xs text-neutral-400 flex-wrap">
                    <span className="truncate">{currentUser.email}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-[#ffd700]/80">
                      <Calendar size={13} />
                      <span>Joined {joinedDate}</span>
                    </span>
                    {formattedBirthDate && (
                      <>
                        <span>•</span>
                        <span className="text-neutral-300">
                          Born on {formattedBirthDate}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-neutral-300 pt-1 leading-relaxed max-w-xl">
                    {bio || "Add a short bio about the anime and manga you enjoy."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap justify-center sm:pb-2">
                <button
                  onClick={handleToggleEdit}
                  className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full transition-colors cursor-pointer"
                >
                  {isEditing ? <X size={16} /> : <Edit3 size={16} />}
                  <span>{isEditing ? "Close" : "Edit Profile"}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white font-montserrat font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full border border-red-500/30 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            <section className="profile-insights" aria-labelledby="profile-insights-title">
              <div className="profile-insights__header"><div><span>Your library</span><h2 id="profile-insights-title">Watching overview</h2></div><div><Link to="/watchlist">Open watchlist</Link><Link to="/favourites">View favorites</Link></div></div>
              <div className="profile-insights__stats">
                <div><strong>{watchlist.length}</strong><span>Tracked</span></div>
                <div><strong>{watchingCount}</strong><span>Watching</span></div>
                <div><strong>{caughtUpCount}</strong><span>Caught up</span></div>
                <div><strong>{completedCount}</strong><span>Completed</span></div>
                <div><strong>{favourites.length}</strong><span>Favorites</span></div>
                <div><strong>{totalEpisodesWatched}</strong><span>Episodes watched</span></div>
                <div><strong>{Math.round(watchMinutes / 60)}</strong><span>Watch hours</span></div>
              </div>
              <div className="profile-insights__demographics">
                <div className="profile-completion">
                  <div className="profile-completion__ring" style={{ "--completion": `${completionRate * 3.6}deg` } as React.CSSProperties}><strong>{completionRate}%</strong><span>complete</span></div>
                  <div><h3>List progress</h3><p>{watchlist.length ? `${completedCount} completed · ${caughtUpCount} caught up · ${pausedCount} paused or dropped` : "Start tracking anime to build your viewing overview."}</p><div className="profile-status-bar"><span style={{ width: `${(watchingCount / (watchlist.length || 1)) * 100}%` }} /><span style={{ width: `${(caughtUpCount / (watchlist.length || 1)) * 100}%` }} /><span style={{ width: `${(completedCount / (watchlist.length || 1)) * 100}%` }} /><span style={{ width: `${(planToWatchCount / (watchlist.length || 1)) * 100}%` }} /></div></div>
                </div>
                <div className="profile-genres"><h3>Most watched genres</h3>{topGenres.length ? topGenres.map(([genre, count]) => <div key={genre}><span>{genre}</span><i><b style={{ width: `${(count / maxGenreCount) * 100}%` }} /></i><small>{count}</small></div>) : <p>Add genres through your Watchlist and Favorites to see your taste here.</p>}</div>
                <div className="profile-radar"><div><span>Your anime fingerprint</span><h3>{userId ? `@${userId}` : displayName || "Anime fan"}</h3><p>Built from genres in your Watchlist and Favorites.</p></div><div className="profile-radar__chart"><svg viewBox="0 0 100 100" role="img" aria-label="Interest web chart">{[1,.75,.5,.25].map((scale) => <polygon key={scale} points={radarGridPoints(scale)} className="profile-radar__grid" />)}{interestAxes.map((_, index) => { const angle = -Math.PI / 2 + index * (Math.PI * 2 / 5); return <line key={`axis-${index}`} x1="50" y1="50" x2={50 + Math.cos(angle) * 42} y2={50 + Math.sin(angle) * 42} className="profile-radar__axis" />; })}<polygon points={radarPoints || "50,50 50,50 50,50 50,50 50,50"} className="profile-radar__area" />{interestAxes.map(([genre], index) => { const angle = -Math.PI / 2 + index * (Math.PI * 2 / 5); return <circle key={`${genre}-${index}`} cx={50 + Math.cos(angle) * 42 * (Number(interestAxes[index][1]) / maxGenreCount)} cy={50 + Math.sin(angle) * 42 * (Number(interestAxes[index][1]) / maxGenreCount)} r="2" />; })}</svg>{interestAxes.map(([genre], index) => <span key={`${genre}-label`} data-axis={index}>{genre}</span>)}</div></div>
              </div>
            </section>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form
            id="edit-profile-form"
            onSubmit={handleSaveProfile}
            className="bg-[#12121c]/95 border border-[#ffd700]/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-2xl animate-fadeIn scroll-mt-24"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-xl font-extrabold font-montserrat text-[#ffd700] flex items-center gap-2">
                <Sparkles size={20} />
                <span>Edit profile</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Custom Avatar Picker & Upload */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase font-montserrat text-neutral-200">
                  Profile Avatar Image
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ffd700] hover:text-[#ffea00] cursor-pointer bg-[#ffd700]/10 border border-[#ffd700]/30 px-3 py-1 rounded-full transition-all">
                  <Upload size={13} />
                  <span>Upload Custom Avatar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleAvatarFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <img
                    key={idx}
                    src={preset}
                    alt={`Avatar Option ${idx + 1}`}
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-14 h-14 rounded-full object-cover cursor-pointer border-2 transition-all hover:scale-110 ${
                      avatarUrl === preset
                        ? "border-[#ffd700] ring-4 ring-[#ffd700]/40 scale-105"
                        : "border-white/20 opacity-70 hover:opacity-100"
                    }`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = AVATAR_PRESETS[4];
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Custom Banner Picker & Upload */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase font-montserrat text-neutral-200">
                  Header Cover Banner Image
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ffd700] hover:text-[#ffea00] cursor-pointer bg-[#ffd700]/10 border border-[#ffd700]/30 px-3 py-1 rounded-full transition-all">
                  <Upload size={13} />
                  <span>Upload Custom Banner</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleBannerFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BANNER_PRESETS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => setBannerUrl(preset)}
                    className={`h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                      bannerUrl === preset
                        ? "border-[#ffd700] ring-4 ring-[#ffd700]/40 scale-105"
                        : "border-white/20 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={preset}
                      alt={`Banner Option ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = BANNER_PRESETS[3];
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Display Name (15 Char Restriction) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="profile-display-name" className="block text-xs font-bold uppercase font-montserrat text-neutral-300">
                  Display Name (Max 15 Characters)
                </label>
                <span className="text-[11px] text-[#ffd700] font-mono">
                  {displayName.length}/15
                </span>
              </div>
              <input
                id="profile-display-name"
                name="displayName"
                type="text"
                maxLength={15}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 15))}
                placeholder="Enter display name (max 15 chars)"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 focus:border-[#ffd700] rounded-xl text-sm text-white outline-none"
              />
            </div>

            {/* Unique User ID Tag */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="profile-user-id" className="block text-xs font-bold uppercase font-montserrat text-neutral-300">
                  Unique User ID (Pinpoint Identifier)
                </label>
                <span className="text-[11px] text-[#ffd700] font-mono">
                  {userId.length}/15
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#ffd700] font-mono font-bold text-sm">@</span>
                <input
                  id="profile-user-id"
                  name="userId"
                  type="text"
                  maxLength={15}
                  value={userId}
                  onChange={(e) => handleUserIdChange(e.target.value)}
                  placeholder="e.g. Ryuma777, Orbit_X1"
                  className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/15 focus:border-[#ffd700] rounded-xl text-sm text-white outline-none font-mono"
                />
              </div>
              {userIdError ? (
                <p className="text-xs text-red-400 mt-1 font-semibold">
                  ⚠️ {userIdError}
                </p>
              ) : (
                <p className="text-[11px] text-neutral-400 mt-1">
                  Must be ≤15 characters, contain at least 1 number and 1 capital letter. Allowed: <code className="text-[#ffd700]">. @ - _</code>
                </p>
              )}
            </div>

            {/* Enhanced Date of Birth & Calendar Picker */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
              <label htmlFor="profile-birth-date" className="flex items-center gap-2 text-xs font-bold uppercase font-montserrat text-neutral-200">
                <Calendar size={16} className="text-[#ffd700]" />
                <span>Date of Birth</span>
              </label>
              <div className="relative">
                <input
                  id="profile-birth-date"
                  name="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-4 py-3 bg-[#12121a] border border-[#ffd700]/40 focus:border-[#ffd700] rounded-xl text-sm text-white outline-none cursor-pointer shadow-inner focus:shadow-[0_0_15px_rgba(255,215,0,0.2)] transition-all"
                />
              </div>
              {calculatedAge !== null ? (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#ffd700] font-bold">
                    Verified Age: {calculatedAge} years old
                  </span>
                  <span className={isAdult ? "text-emerald-400 font-semibold" : "text-blue-400 font-semibold"}>
                    {isAdult ? "Eligible for Mature 18+ Anime" : "Protected Mode (Teen)"}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-neutral-400">
                  Enter your birth date to calculate your age and receive personalized birthday greetings.
                </p>
              )}
            </div>

            {/* Mature Anime Content Preference */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="profile-allow-mature" className="text-sm font-bold font-montserrat text-white flex items-center gap-1.5 cursor-pointer">
                    <ShieldAlert size={16} className={isAdult ? "text-[#ffd700]" : "text-neutral-500"} />
                    <span>Include 18+ Mature & R-17+ Content</span>
                  </label>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {isAdult
                      ? "Toggle to display unfiltered 18+ ecchi, psychological horror, and mature titles in search & discoveries."
                      : "Mature content is disabled for users under 18 years old."}
                  </p>
                </div>
                <input
                  id="profile-allow-mature"
                  name="allowMature"
                  type="checkbox"
                  disabled={!isAdult}
                  checked={isAdult && allowMatureContent}
                  onChange={(e) => setAllowMatureContent(e.target.checked)}
                  className="w-5 h-5 accent-[#ffd700] rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Favorite Genre */}
            <div>
              <label htmlFor="profile-favorite-genre" className="block text-xs font-bold uppercase font-montserrat text-neutral-300 mb-2">
                Favorite genre
              </label>
              <AppDropdown ariaLabel="Favorite genre" value={favoriteGenre} onChange={setFavoriteGenre} options={[
                  "Action",
                  "Adventure",
                  "Comedy",
                  "Drama",
                  "Fantasy",
                  "Horror",
                  "Mystery",
                  "Psychological",
                  "Romance",
                  "Sci-Fi",
                  "Slice of Life",
                  "Sports",
                  "Supernatural",
                  "Thriller",
                ].map((genre) => ({ value: genre, label: genre }))} />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="profile-bio" className="block text-xs font-bold uppercase font-montserrat text-neutral-300 mb-2">
                About You (Bio)
              </label>
              <textarea
                id="profile-bio"
                name="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your favorite anime, favorite characters, or watching style..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 focus:border-[#ffd700] rounded-xl text-sm text-white outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-full border border-white/20 text-neutral-300 hover:text-white font-montserrat font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-black text-xs transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:scale-105 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
