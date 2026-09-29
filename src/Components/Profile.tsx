import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useFavourites } from "../context/FavouritesContext";
import { useWatchlist } from "../context/WatchlistContext";
import { db } from "../firebase/config";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
} from "firebase/auth";
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
  Camera,
  Share2,
  Copy,
  Check,
  PlayCircle,
  Radio,
  CheckCircle2,
  Tv,
  Film,
  Disc3,
  Layers3,
  Clock3,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import AuthModal from "./AuthModal";
import SEO from "./SEO";
import Footer from "./Footer";
import AppDropdown from "./AppDropdown";
import { getAnimeListByIds, setMatureContentPreference } from "../services/anilist";
import { safeImageUrl, sanitizeHandle, sanitizeInput } from "../utils/security";
import { AVATAR_PRESETS, BANNER_PRESETS } from "../generated/profileAssets";
import { claimProfileHandle, createAvailableProfileHandle, isProfileHandleAvailable, validateProfileHandle } from "../services/profileHandle";

type ProfileAssetDialogProps = {
  kind: "avatar" | "banner";
  open: boolean;
  value: string;
  choices: readonly string[];
  fallbackLabel: string;
  onChange: (value: string) => void;
  onClose: () => void;
};

const ProfileAssetDialog: React.FC<ProfileAssetDialogProps> = ({
  kind,
  open,
  value,
  choices,
  fallbackLabel,
  onChange,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isAvatar = kind === "avatar";
  const title = isAvatar ? "Choose your profile avatar" : "Choose your profile cover";
  const description = isAvatar
    ? "Pick a character image or keep the clean name-initial avatar."
    : "Choose a wide banner for the top of your profile, or use the Anime Orbit signature.";
  const initial = (fallbackLabel.trim() || "A").charAt(0).toUpperCase();

  return createPortal(
    <div
      className="profile-asset-dialog"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`profile-asset-dialog__panel is-${kind}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`profile-${kind}-dialog-title`}
      >
        <header className="profile-asset-dialog__header">
          <div>
            <span>Profile appearance</span>
            <h2 id={`profile-${kind}-dialog-title`}>{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={`Close ${kind} picker`}>
            <X size={21} />
          </button>
        </header>

        <div className={`profile-asset-dialog__grid is-${kind}`}>
          <button
            type="button"
            className={`profile-asset-dialog__choice is-fallback ${!value ? "is-selected" : ""}`}
            onClick={() => onChange("")}
            aria-pressed={!value}
          >
            {isAvatar ? (
              <span className="profile-asset-dialog__initial">{initial}</span>
            ) : (
              <span className="profile-asset-dialog__empty-cover">ANIME ORBIT</span>
            )}
            <span className="profile-asset-dialog__choice-label">
              {isAvatar ? "Use name initial" : "Use signature cover"}
            </span>
            {!value && <span className="profile-asset-dialog__check"><Check size={14} /></span>}
          </button>

          {choices.map((choice, index) => (
            <button
              type="button"
              key={choice}
              className={`profile-asset-dialog__choice ${value === choice ? "is-selected" : ""}`}
              onClick={() => onChange(choice)}
              aria-label={`Select ${kind} ${index + 1}`}
              aria-pressed={value === choice}
            >
              <img src={choice} alt="" loading="lazy" />
              {value === choice && <span className="profile-asset-dialog__check"><Check size={14} /></span>}
            </button>
          ))}
        </div>

        <footer className="profile-asset-dialog__footer">
          <span>{value ? "Selection ready" : isAvatar ? "Name initial selected" : "Signature cover selected"}</span>
          <button type="button" onClick={onClose}>Use this {kind}</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
};

const isAdultBirthDate = (value: string) => {
  if (!value) return false;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 18;
};

export const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { favourites } = useFavourites();
  const { watchlist } = useWatchlist();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState("");
  const [savedUserId, setSavedUserId] = useState("");
  const [userIdError, setUserIdError] = useState("");
  const [userIdChecking, setUserIdChecking] = useState(false);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [favoriteGenre, setFavoriteGenre] = useState("Action");
  const [birthDate, setBirthDate] = useState("");
  const [allowMatureContent, setAllowMatureContent] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const [animeMetadata, setAnimeMetadata] = useState<
    Record<
      number,
      {
        genres: string[];
        type?: string;
        duration?: number | string | null;
        episodes?: number | null;
      }
    >
  >({});

  // Deletion States
  const [deletionScheduled, setDeletionScheduled] = useState(false);
  const [scheduledDeletionDate, setScheduledDeletionDate] = useState<
    string | null
  >(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const scrollToProfileCard = () => {
    window.setTimeout(() => {
      document
        .getElementById("profile-card")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const closeEditSection = () => {
    setIsEditing(false);
    setAvatarPickerOpen(false);
    setBannerPickerOpen(false);
    scrollToProfileCard();
  };

  const handleOpenEditSection = () => {
    setIsEditing(true);
    setTimeout(() => {
      document
        .getElementById("edit-profile-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      closeEditSection();
      return;
    }
    handleOpenEditSection();
  };

  const openAssetPicker = (kind: "avatar" | "banner") => {
    setIsEditing(true);
    setAvatarPickerOpen(kind === "avatar");
    setBannerPickerOpen(kind === "banner");
  };

  const closeAssetPicker = (kind: "avatar" | "banner") => {
    if (kind === "avatar") setAvatarPickerOpen(false);
    else setBannerPickerOpen(false);
    window.setTimeout(() => {
      document
        .getElementById("edit-profile-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  useEffect(() => {
    if (!currentUser) {
      setMatureContentPreference(false);
      return;
    }
    setDisplayName((currentUser.displayName || "").slice(0, 15));
    setAvatarUrl(currentUser.photoURL || "");

    const fetchUserProfile = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.displayName) setDisplayName(data.displayName.slice(0, 15));
          if (data.userId) {
            setUserId(data.userId);
            setSavedUserId(data.userId);
          } else {
            const generatedId = await createAvailableProfileHandle(
              currentUser.uid,
              data.displayName || currentUser.displayName || currentUser.email?.split("@")[0] || "AnimeFan",
            );
            setUserId(generatedId);
            setSavedUserId(generatedId);
            await setDoc(userDocRef, { userId: generatedId, updatedAt: new Date().toISOString() }, { merge: true });
          }
          if (data.bio) setBio(data.bio);
          if (data.favoriteGenre) setFavoriteGenre(data.favoriteGenre);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
          if (data.bannerUrl) setBannerUrl(data.bannerUrl);
          if (data.birthDate) setBirthDate(data.birthDate);
          if (typeof data.allowMatureContent === "boolean") {
            const permitted = isAdultBirthDate(String(data.birthDate || "")) && data.allowMatureContent;
            setAllowMatureContent(permitted);
            setMatureContentPreference(permitted);
          }

          if (data.deletionScheduled) {
            await updateDoc(userDocRef, {
              deletionScheduled: false,
              scheduledDeletionDate: null,
              deletionStatus: "cancelled_by_login",
            });
            setDeletionScheduled(false);
            setScheduledDeletionDate(null);
            toast.info(
              "Welcome back! Your scheduled account deletion has been cancelled.",
            );
          } else if (data.scheduledDeletionDate) {
            setDeletionScheduled(true);
            setScheduledDeletionDate(data.scheduledDeletionDate);
          }
        } else {
          const generatedId = await createAvailableProfileHandle(
            currentUser.uid,
            currentUser.displayName || currentUser.email?.split("@")[0] || "AnimeFan",
          );
          setUserId(generatedId);
          setSavedUserId(generatedId);
          await setDoc(userDocRef, {
            displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Anime Fan",
            userId: generatedId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
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
      .filter((item) => !animeMetadata[item.mal_id])
      .map((item) => Number(item.mal_id))
      .filter(Boolean);
    if (!missingIds.length) return;
    let active = true;
    const uniqueIds = [...new Set(missingIds)];
    const chunks = Array.from(
      { length: Math.ceil(uniqueIds.length / 50) },
      (_, index) => uniqueIds.slice(index * 50, index * 50 + 50),
    );
    Promise.all(
      chunks.map((ids) => getAnimeListByIds(ids, { includeAdult: true })),
    ).then((groups: any[][]) => {
      if (!active) return;
      const titles = groups.flat();
      setAnimeMetadata((current) => {
        const next = { ...current };
        uniqueIds.forEach((mediaId) => {
          if (!next[mediaId]) next[mediaId] = { genres: [] };
        });
        titles.forEach((title) => {
          next[Number(title.mal_id)] = {
            genres: (title.genres || [])
              .map((genre: any) =>
                typeof genre === "string" ? genre : genre?.name,
              )
              .filter(Boolean),
            type: title.type,
            duration: title.duration,
            episodes: title.episodes,
          };
        });
        return next;
      });
    });
    return () => {
      active = false;
    };
  }, [currentUser, watchlist, favourites, animeMetadata]);

  const handleUserIdChange = (val: string) => {
    const trimmed = val.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24);
    setUserId(trimmed);
    const err = validateProfileHandle(trimmed);
    setUserIdError(err || "");
  };

  useEffect(() => {
    if (!currentUser || !userId || userId === savedUserId || validateProfileHandle(userId)) {
      setUserIdChecking(false);
      return;
    }
    let active = true;
    setUserIdChecking(true);
    const timer = window.setTimeout(() => {
      void isProfileHandleAvailable(userId, currentUser.uid)
        .then((available) => { if (active) setUserIdError(available ? "" : "That profile ID is already taken"); })
        .catch(() => { if (active) setUserIdError("Could not check this ID right now"); })
        .finally(() => { if (active) setUserIdChecking(false); });
    }, 350);
    return () => { active = false; window.clearTimeout(timer); };
  }, [currentUser, userId, savedUserId]);

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
      return new Date(currentUser.metadata.creationTime).toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        },
      );
    } catch {
      return "Recently";
    }
  }, [currentUser]);

  const formattedBirthDate = useMemo(() => {
    if (!birthDate) return null;
    try {
      const parts = birthDate.split("-");
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
        );
        return d.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
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
    return (
      birth.getDate() === today.getDate() &&
      birth.getMonth() === today.getMonth()
    );
  }, [birthDate]);

  const isAdult = calculatedAge !== null && calculatedAge >= 18;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const idError = validateProfileHandle(userId);
    if (idError || userIdError || userIdChecking) {
      const message = idError || userIdError || "Wait for the profile ID check to finish";
      setUserIdError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    try {
      const finalMatureSetting = isAdult ? allowMatureContent : false;
      const safeDisplayName = sanitizeInput(displayName, 15) || "Anime Fan";
      const safeUserId = sanitizeHandle(userId);
      const safeBio = sanitizeInput(bio, 500);
      const safeAvatarUrl = safeImageUrl(avatarUrl);
      const safeBannerUrl = safeImageUrl(bannerUrl);
      const safeGenre = sanitizeInput(favoriteGenre, 40) || "Action";
      const updatedAt = new Date().toISOString();
      await claimProfileHandle(currentUser.uid, safeUserId, savedUserId);

      try {
        await updateProfile(currentUser, {
          displayName: safeDisplayName,
          photoURL: safeAvatarUrl || null,
        });
      } catch {
        // Handled
      }

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          displayName: safeDisplayName,
          userId: safeUserId,
          bio: safeBio,
          avatarUrl: safeAvatarUrl,
          bannerUrl: safeBannerUrl,
          favoriteGenre: safeGenre,
          birthDate,
          allowMatureContent: finalMatureSetting,
          updatedAt,
        },
        { merge: true },
      );

      // Public pages read only this intentionally small document. Keep this
      // projection separate from the private save so a temporary rules or
      // network failure cannot make successfully saved account details appear
      // to have failed.
      let publicProfileSynced = true;
      try {
      await setDoc(doc(db, "publicProfiles", currentUser.uid), {
          displayName: safeDisplayName,
          userId: safeUserId,
          bio: safeBio,
          avatarUrl: safeAvatarUrl,
          bannerUrl: safeBannerUrl,
          favoriteGenre: safeGenre,
          createdAt: currentUser.metadata.creationTime || updatedAt,
        updatedAt,
      }, { merge: true });
      } catch {
        publicProfileSynced = false;
      }

      window.dispatchEvent(
        new CustomEvent("orbit_profile_updated", {
          detail: {
            displayName: safeDisplayName,
            avatarUrl: safeAvatarUrl,
            bannerUrl: safeBannerUrl,
            profileHandle: safeUserId || currentUser.uid,
          },
        }),
      );
      setMatureContentPreference(finalMatureSetting);
      setSavedUserId(safeUserId);

      if (publicProfileSynced) {
        toast.success("Profile saved successfully!");
      } else {
        toast.warning(
          "Profile saved. The public profile preview could not sync yet; retry after the connection is restored.",
        );
      }
      closeEditSection();
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code?: unknown }).code || "")
          : "";
      if (code === "profile/handle-taken") {
        setUserIdError("That profile ID is already taken");
      }
      toast.error(
        code === "profile/handle-taken"
          ? "That profile ID is already taken. Choose another one."
          : code.includes("permission-denied") || code.includes("unauthenticated")
          ? "Your session cannot save profile changes. Sign in again and retry."
          : "Unable to save profile changes. Check your connection and retry.",
      );
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
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        deletePassword,
      );
      await reauthenticateWithCredential(currentUser, credential);

      const destructDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          deletionScheduled: true,
          scheduledDeletionDate: destructDate,
          deletionStatus: "pending_destruction",
        },
        { merge: true },
      );

      setDeletionScheduled(true);
      setScheduledDeletionDate(destructDate);
      setDeleteModalOpen(false);
      setDeletePassword("");
      toast.warning(
        "Account deletion scheduled. You have 30 days to log in to cancel!",
      );
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
        { merge: true },
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
          noIndex
        />
        <div className="bg-[#12121c]/90 border border-white/10 p-8 rounded-3xl text-center max-w-md w-full backdrop-blur-xl shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/30 flex items-center justify-center text-[#ffd700] mx-auto">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-montserrat text-white mb-2">
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
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  const watchingCount = watchlist.filter(
    (item) => (item.status || "Plan to Watch") === "Watching",
  ).length;
  const completedCount = watchlist.filter(
    (item) => (item.status || "Plan to Watch") === "Completed",
  ).length;
  const planToWatchCount = watchlist.filter(
    (item) => (item.status || "Plan to Watch") === "Plan to Watch",
  ).length;
  const caughtUpCount = watchlist.filter(
    (item) => item.status === "Caught Up",
  ).length;
  const pausedCount = watchlist.filter(
    (item) => item.status === "On-Hold" || item.status === "Dropped",
  ).length;
  const completionRate = watchlist.length
    ? Math.round((completedCount / watchlist.length) * 100)
    : 0;
  const genreCounts = [...watchlist, ...favourites].reduce<
    Record<string, number>
  >((counts, item: any) => {
    const genres = (item.genres || []).length
      ? item.genres
      : animeMetadata[item.mal_id]?.genres || [];
    genres.forEach((rawGenre: any) => {
      const genre = typeof rawGenre === "string" ? rawGenre : rawGenre?.name;
      if (genre) counts[genre] = (counts[genre] || 0) + 1;
    });
    return counts;
  }, {});
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxGenreCount = topGenres[0]?.[1] || 1;
  const viewingBreakdown = watchlist.reduce(
    (totals, item) => {
      const metadata = animeMetadata[item.mal_id];
      const format = String(item.type || metadata?.type || "TV")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");
      const episodeTotal = Math.max(
        0,
        Number(item.episodes || metadata?.episodes || 0),
      );
      const logged = Math.max(0, Number(item.progress || 0));
      const completed = item.status === "Completed";
      const watchedUnits = Math.floor(
        completed
          ? Math.max(logged, episodeTotal || 1)
          : logged,
      );
      if (!watchedUnits) return totals;

      if (format === "MOVIE") totals.movies += watchedUnits;
      else if (format === "OVA") totals.ova += watchedUnits;
      else if (format === "ONA") totals.ona += watchedUnits;
      else if (format === "SPECIAL") totals.specials += watchedUnits;
      else if (format === "TV" || format === "TV_SHORT")
        totals.tvEpisodes += watchedUnits;
      else totals.other += watchedUnits;

      const durationValue = item.duration ?? metadata?.duration;
      const parsedDuration = Number(
        String(durationValue ?? "").match(/[\d.]+/)?.[0] || 0,
      );
      const fallbackDuration =
        format === "MOVIE" ? 100 : format === "MUSIC" ? 4 : 24;
      totals.minutes += watchedUnits * (parsedDuration || fallbackDuration);
      return totals;
    },
    {
      tvEpisodes: 0,
      movies: 0,
      ova: 0,
      ona: 0,
      specials: 0,
      other: 0,
      minutes: 0,
    },
  );
  const watchHours = (viewingBreakdown.minutes / 60).toFixed(2);
  const interestAxes = Array.from(
    { length: 5 },
    (_, index) =>
      topGenres[index] || ([`Taste ${index + 1}`, 0] as [string, number]),
  );
  const radarPoints = interestAxes
    .map(([, count], index) => {
      const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 5);
      const radius = 42 * (Number(count) / maxGenreCount);
      return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
    })
    .join(" ");
  const radarGridPoints = (scale: number) =>
    interestAxes
      .map((_, index) => {
        const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 5);
        return `${50 + Math.cos(angle) * 42 * scale},${50 + Math.sin(angle) * 42 * scale}`;
      })
      .join(" ");
  const identityGenre = topGenres[0]?.[0] || favoriteGenre || "Anime";

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title={`${displayName || "User"}'s Orbit Profile - Anime Orbit`}
        description={`Explore ${displayName || "User"}'s anime watchlist, favorite tier list, and activity on Anime Orbit.`}
        keywords="anime profile, anime favorites, user watchlist, Anime Orbit"
        url="https://animeorbit.web.app/profile"
        noIndex
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-16 space-y-6 flex-1 w-full">
        {/* Birthday Banner Greeting */}
        {isBirthdayToday && (
          <div className="relative bg-[#18181d] border border-[#ffd700]/35 rounded-2xl p-5 sm:p-6 text-center shadow-lg">
            <Cake size={44} className="mx-auto text-[#ffd700] mb-2" />
            <h2 className="text-2xl sm:text-3xl font-bold font-montserrat text-white drop-shadow-md">
              Happy birthday, {displayName || "Anime Fan"}
            </h2>
            <p className="text-sm text-neutral-200 mt-2 max-w-lg mx-auto leading-relaxed">
              Wishing you a wonderful year filled with thrilling adventures,
              unforgettable stories, and great anime moments!
            </p>
          </div>
        )}

        {/* 30-Day Scheduled Deletion Active Warning Banner */}
        {deletionScheduled && scheduledDeletionDate && (
          <div className="relative bg-red-950/55 border border-red-500/60 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <AlertTriangle
                size={28}
                className="text-red-400 flex-shrink-0 mt-0.5"
              />
              <div>
                <h3 className="text-base font-bold font-montserrat text-red-200">
                  Account deletion scheduled
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                  Your account and all associated data are scheduled to be
                  deleted on{" "}
                  <span className="font-bold text-white">
                    {new Date(scheduledDeletionDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
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
        <div
          id="profile-card"
          className="profile-card relative bg-[#15151a] border border-white/10 rounded-2xl overflow-hidden shadow-xl scroll-mt-24"
        >
          {/* Custom Header Cover Banner */}
          <div className={`profile-cover ${bannerUrl ? "has-banner" : "is-empty"} relative h-36 sm:h-48 w-full overflow-hidden bg-neutral-900`}>
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Profile cover banner"
                className="w-full h-full object-cover"
                onError={() => setBannerUrl("")}
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_25%_30%,rgba(255,215,0,0.18),transparent_35%),linear-gradient(135deg,#19191f,#08080b)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#12121c] via-[#12121c]/40 to-black/30" />
            <button
              onClick={() => openAssetPicker("banner")}
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
                      onError={() => setAvatarUrl("")}
                    />
                  ) : (
                    <span className="font-montserrat text-3xl font-bold text-[#ffd700]">
                      {(displayName || currentUser.email || "A")[0].toUpperCase()}
                    </span>
                  )}
                  <button
                    onClick={() => openAssetPicker("avatar")}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[10px] font-bold gap-1"
                  >
                    <Camera size={18} className="text-[#ffd700]" />
                    <span>Change</span>
                  </button>
                </div>

                <div className="profile-identity-panel space-y-2 min-w-0 sm:pb-2">
                  <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold font-montserrat text-white truncate">
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

                  <div
                    className="profile-identity-stamp"
                    aria-label="Anime profile identity"
                  >
                    <span>Anime Orbit profile</span>
                    <strong>{identityGenre} fan</strong>
                    <small>
                      {completedCount} completed ·{" "}
                      {watchHours} watch hours
                    </small>
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
                    {bio ||
                      "Add a short bio about the anime and manga you enjoy."}
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

            <section
              className="profile-insights"
              aria-labelledby="profile-insights-title"
            >
              <div className="profile-insights__header">
                <div>
                  <h2 id="profile-insights-title">Profile overview</h2>
                </div>
                <div>
                  <Link to="/watchlist">Open watchlist</Link>
                  <Link to="/favourites">View favorites</Link>
                </div>
              </div>
              <div className="profile-insights__stats">
                <div>
                  <List size={18} aria-hidden="true" />
                  <strong>{watchlist.length}</strong>
                  <span>Tracked</span>
                </div>
                <div>
                  <PlayCircle size={18} aria-hidden="true" />
                  <strong>{watchingCount}</strong>
                  <span>Watching</span>
                </div>
                <div>
                  <Radio size={18} aria-hidden="true" />
                  <strong>{caughtUpCount}</strong>
                  <span>Caught up</span>
                </div>
                <div>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <strong>{completedCount}</strong>
                  <span>Completed</span>
                </div>
                <div>
                  <Heart size={18} aria-hidden="true" />
                  <strong>{favourites.length}</strong>
                  <span>Favorites</span>
                </div>
              </div>
              <section
                className="profile-viewing-breakdown"
                aria-labelledby="profile-viewing-breakdown-title"
              >
                <header>
                  <div>
                    <h3 id="profile-viewing-breakdown-title">Complete Watch Activity</h3>
                  </div>
                  <p>Shows the actual numbers from Watchlist.</p>
                </header>
                <div>
                  <article><Tv aria-hidden="true" /><strong>{viewingBreakdown.tvEpisodes}</strong><span>TV episodes</span></article>
                  <article><Film aria-hidden="true" /><strong>{viewingBreakdown.movies}</strong><span>Movies</span></article>
                  <article><Disc3 aria-hidden="true" /><strong>{viewingBreakdown.ova}</strong><span>OVA episodes</span></article>
                  <article><Radio aria-hidden="true" /><strong>{viewingBreakdown.ona}</strong><span>ONA episodes</span></article>
                  <article><Sparkles aria-hidden="true" /><strong>{viewingBreakdown.specials}</strong><span>Specials</span></article>
                  <article><Layers3 aria-hidden="true" /><strong>{viewingBreakdown.other}</strong><span>Other</span></article>
                  <article className="is-hours"><Clock3 aria-hidden="true" /><strong>{watchHours}<small> hrs</small></strong><span>Actual watch time</span></article>
                </div>
              </section>
              <div className="profile-insights__demographics">
                <div className="profile-completion">
                  <div
                    className="profile-completion__ring"
                    style={
                      {
                        "--completion": `${completionRate * 3.6}deg`,
                      } as React.CSSProperties
                    }
                  >
                    <strong>{completionRate}%</strong>
                  </div>
                  <div>
                    <h3>List progress</h3>
                    <p>
                      {watchlist.length
                        ? `${completedCount} completed · ${caughtUpCount} caught up · ${pausedCount} paused or dropped`
                        : "Start tracking anime to build your viewing overview."}
                    </p>
                    <div className="profile-status-bar">
                      <span
                        style={{
                          width: `${(watchingCount / (watchlist.length || 1)) * 100}%`,
                        }}
                      />
                      <span
                        style={{
                          width: `${(caughtUpCount / (watchlist.length || 1)) * 100}%`,
                        }}
                      />
                      <span
                        style={{
                          width: `${(completedCount / (watchlist.length || 1)) * 100}%`,
                        }}
                      />
                      <span
                        style={{
                          width: `${(planToWatchCount / (watchlist.length || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="profile-genres">
                  <h3>Most watched genres</h3>
                  {topGenres.length ? (
                    topGenres.map(([genre, count]) => (
                      <div key={genre}>
                        <span>{genre}</span>
                        <i>
                          <b
                            style={{
                              width: `${(count / maxGenreCount) * 100}%`,
                            }}
                          />
                        </i>
                        <small>{count}</small>
                      </div>
                    ))
                  ) : (
                    <p>
                      Add genres through your Watchlist and Favorites to see
                      your taste here.
                    </p>
                  )}
                </div>
                <div className="profile-radar">
                  <div>
                    <h3>
                      {userId ? `@${userId}` : displayName || "Anime fan"}
                    </h3>
                    <p>Built from genres in your Watchlist and Favorites.</p>
                  </div>
                  <div className="profile-radar__chart">
                    <svg
                      viewBox="0 0 100 100"
                      role="img"
                      aria-label="Interest web chart"
                    >
                      {[1, 0.75, 0.5, 0.25].map((scale) => (
                        <polygon
                          key={scale}
                          points={radarGridPoints(scale)}
                          className="profile-radar__grid"
                        />
                      ))}
                      {interestAxes.map((_, index) => {
                        const angle =
                          -Math.PI / 2 + index * ((Math.PI * 2) / 5);
                        return (
                          <line
                            key={`axis-${index}`}
                            x1="50"
                            y1="50"
                            x2={50 + Math.cos(angle) * 42}
                            y2={50 + Math.sin(angle) * 42}
                            className="profile-radar__axis"
                          />
                        );
                      })}
                      <polygon
                        points={radarPoints || "50,50 50,50 50,50 50,50 50,50"}
                        className="profile-radar__area"
                      />
                      {interestAxes.map(([genre], index) => {
                        const angle =
                          -Math.PI / 2 + index * ((Math.PI * 2) / 5);
                        return (
                          <circle
                            key={`${genre}-${index}`}
                            cx={
                              50 +
                              Math.cos(angle) *
                                42 *
                                (Number(interestAxes[index][1]) / maxGenreCount)
                            }
                            cy={
                              50 +
                              Math.sin(angle) *
                                42 *
                                (Number(interestAxes[index][1]) / maxGenreCount)
                            }
                            r="2"
                          />
                        );
                      })}
                    </svg>
                    {interestAxes.map(([genre], index) => (
                      <span key={`${genre}-label`} data-axis={index}>
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form
            id="edit-profile-form"
            onSubmit={handleSaveProfile}
            className="profile-application-form animate-fadeIn scroll-mt-24"
          >
            <header className="profile-application-form__header">
              <div>
                <span><Sparkles size={15} /> Anime Orbit profile form</span>
                <h2>Edit your profile</h2>
                <p>Complete the sections below, then save once to return to your finished profile.</p>
              </div>
              <button
                type="button"
                onClick={closeEditSection}
                aria-label="Close profile form"
              >
                <X size={21} />
              </button>
            </header>

            <fieldset className="profile-form-section">
              <legend><span>01</span> Public identity</legend>
              <p className="profile-form-section__intro">Choose how you appear across comments, reviews, shared lists, and public pages.</p>

              <div className="profile-form-media-row">
                <button type="button" className="profile-form-media-choice is-avatar" onClick={() => openAssetPicker("avatar")}>
                  <span className="profile-form-media-choice__preview">
                    {avatarUrl ? <img src={avatarUrl} alt="Selected profile avatar" /> : <strong>{(displayName || currentUser.email || "A")[0].toUpperCase()}</strong>}
                  </span>
                  <span className="profile-form-media-choice__copy">
                    <strong>Profile avatar</strong>
                    <small>{avatarUrl ? "Character image selected" : "Name initial selected"}</small>
                  </span>
                  <span className="profile-form-media-choice__action"><Camera size={15} /> Choose</span>
                </button>

                <button type="button" className="profile-form-media-choice is-banner" onClick={() => openAssetPicker("banner")}>
                  <span className="profile-form-media-choice__preview">
                    {bannerUrl ? <img src={bannerUrl} alt="Selected profile cover" /> : <strong>ANIME ORBIT</strong>}
                  </span>
                  <span className="profile-form-media-choice__copy">
                    <strong>Header cover</strong>
                    <small>{bannerUrl ? "Wide cover image selected" : "Signature cover selected"}</small>
                  </span>
                  <span className="profile-form-media-choice__action"><Camera size={15} /> Choose</span>
                </button>
              </div>

              <div className="profile-form-grid">

                <div className="profile-form-field">
              <div className="profile-form-field__label">
                <label
                  htmlFor="profile-display-name"
                >
                  Display name
                </label>
                <span>
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
                placeholder="Your public display name"
              />
              <small>This is the name other fans see.</small>
            </div>

            <div className="profile-form-field">
              <div className="profile-form-field__label">
                <label
                  htmlFor="profile-user-id"
                >
                  Profile link
                </label>
                <span>
                  {userId.length}/24
                </span>
              </div>
              <div className="profile-form-field__prefixed">
                <span>
                  @
                </span>
                <input
                  id="profile-user-id"
                  name="userId"
                  type="text"
                  maxLength={24}
                  value={userId}
                  onChange={(e) => handleUserIdChange(e.target.value)}
                  placeholder="your-profile-link"
                />
              </div>
              {userIdError ? (
                <p className="is-error">
                  {userIdError}
                </p>
              ) : userIdChecking ? (
                <p className="is-checking">
                  Checking availability...
                </p>
              ) : (
                <p>
                  Used only for the unique link to your public profile.
                </p>
              )}
            </div>
              </div>
            </fieldset>

            <fieldset className="profile-form-section">
              <legend><span>02</span> Personal details</legend>

            {/* Enhanced Date of Birth & Calendar Picker */}
            <div className="profile-form-field">
              <label
                htmlFor="profile-birth-date"
                className="profile-form-field__title"
              >
                <Calendar size={16} className="text-[#ffd700]" />
                <span>Date of birth</span>
              </label>
              <div className="relative">
                <input
                  id="profile-birth-date"
                  name="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>
              {calculatedAge !== null ? (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#ffd700] font-bold">
                    Verified Age: {calculatedAge} years old
                  </span>
                  <span
                    className={
                      isAdult
                        ? "text-emerald-400 font-semibold"
                        : "text-blue-400 font-semibold"
                    }
                  >
                    {isAdult
                      ? "Eligible for Mature 18+ Anime"
                      : "Protected Mode (Teen)"}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-neutral-400">
                  Enter your birth date to calculate your age and receive
                  personalized birthday greetings.
                </p>
              )}
            </div>
            </fieldset>

            <fieldset className="profile-form-section">
              <legend><span>03</span> Discovery preference</legend>
            <div className="profile-form-preference">
              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="profile-allow-mature"
                    className="text-sm font-bold font-montserrat text-[#ffd700] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert
                      size={16}
                      className={
                        isAdult ? "text-[#ffd700]" : "text-neutral-500"
                      }
                    />
                    <span>Include mature content</span>
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
            </fieldset>

            <fieldset className="profile-form-section">
              <legend><span>04</span> Anime taste</legend>
            <div className="profile-form-field">
              <label
                htmlFor="profile-favorite-genre"
                className="profile-form-field__title"
              >
                Favorite genre
              </label>
              <AppDropdown
                ariaLabel="Favorite genre"
                value={favoriteGenre}
                onChange={setFavoriteGenre}
                options={[
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
                ].map((genre) => ({ value: genre, label: genre }))}
              />
            </div>
            </fieldset>

            <fieldset className="profile-form-section">
              <legend><span>05</span> About your profile</legend>
            <div className="profile-form-field">
              <label
                htmlFor="profile-bio"
                className="profile-form-field__title"
              >
                About you
              </label>
              <textarea
                id="profile-bio"
                name="bio"
                rows={4}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your favorite anime, characters, or watching style…"
              />
            </div>
            </fieldset>

            <footer className="profile-application-form__actions">
              <p><CheckCircle2 size={16} /> Save once to return to your full profile.</p>
              <button
                type="button"
                onClick={closeEditSection}
                className="profile-form-button is-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="profile-form-button is-primary"
              >
                <Save size={16} />
                <span>{saving ? "Saving changes…" : "Save profile"}</span>
              </button>
            </footer>
          </form>
        )}

        <ProfileAssetDialog
          kind="avatar"
          open={avatarPickerOpen}
          value={avatarUrl}
          choices={AVATAR_PRESETS}
          fallbackLabel={displayName || currentUser.email || "Anime fan"}
          onChange={setAvatarUrl}
          onClose={() => closeAssetPicker("avatar")}
        />
        <ProfileAssetDialog
          kind="banner"
          open={bannerPickerOpen}
          value={bannerUrl}
          choices={BANNER_PRESETS}
          fallbackLabel={displayName || currentUser.email || "Anime fan"}
          onChange={setBannerUrl}
          onClose={() => closeAssetPicker("banner")}
        />
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
