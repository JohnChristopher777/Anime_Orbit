import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavourites } from "../context/FavouritesContext";
import { useWatchlist } from "../context/WatchlistContext";
import { db, auth } from "../firebase/config";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import {
  User,
  Heart,
  List,
  CheckCircle,
  Clock,
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
  Trash2,
  AlertTriangle,
  Lock,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80",
];

export const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { favourites } = useFavourites();
  const { watchlist, watched } = useWatchlist();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [favoriteGenre, setFavoriteGenre] = useState("Action");
  const [birthDate, setBirthDate] = useState("");
  const [allowMatureContent, setAllowMatureContent] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Deletion & Destruct States
  const [deletionScheduled, setDeletionScheduled] = useState(false);
  const [scheduledDeletionDate, setScheduledDeletionDate] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setDisplayName(currentUser.displayName || "");
    setAvatarUrl(currentUser.photoURL || AVATAR_PRESETS[0]);

    const fetchUserProfile = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.displayName) setDisplayName(data.displayName);
          if (data.bio) setBio(data.bio);
          if (data.favoriteGenre) setFavoriteGenre(data.favoriteGenre);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
          if (data.birthDate) setBirthDate(data.birthDate);
          if (typeof data.allowMatureContent === "boolean") {
            setAllowMatureContent(data.allowMatureContent);
          }

          // If user logged in while deletion was scheduled, cancel deletion automatically!
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

  // Joined Date format
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

  // Calculated age
  const calculatedAge = useMemo(() => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [birthDate]);

  // Formatted birthdate for display
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

  // Birthday greeting check
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
    setSaving(true);
    try {
      const finalMatureSetting = isAdult ? allowMatureContent : false;

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          displayName,
          bio,
          avatarUrl,
          favoriteGenre,
          birthDate,
          allowMatureContent: finalMatureSetting,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
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

  // Schedule Account Deletion with 30-day grace period
  const handleScheduleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.email) return;
    setDeleting(true);

    try {
      // 1. Password Verification
      const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Schedule deletion for 30 days from today
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
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        toast.error("Incorrect password. Verification failed.");
      } else {
        toast.error("Failed to verify credentials: " + (err.message || "Error"));
      }
    } finally {
      setDeleting(false);
    }
  };

  // Cancel Scheduled Deletion
  const handleCancelDeletion = async () => {
    if (!currentUser) return;
    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          deletionScheduled: false,
          scheduledDeletionDate: null,
          deletionStatus: "cancelled_by_user",
        },
        { merge: true }
      );
      setDeletionScheduled(false);
      setScheduledDeletionDate(null);
      toast.success("Scheduled account deletion has been cancelled!");
    } catch {
      toast.error("Failed to cancel deletion request.");
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 font-inter">
        <User size={56} className="mx-auto text-[#ffd700]" />
        <h2 className="text-3xl font-extrabold font-montserrat text-white">
          My Profile
        </h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto">
          Sign in to customize your avatar, view your watching history, and manage your preferences.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-extrabold px-6 py-2.5 rounded-full text-sm font-montserrat shadow-lg hover:scale-105 transition-all cursor-pointer"
        >
          <LogIn size={16} />
          <span>Sign In to Your Account</span>
        </button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  const watchingCount = watchlist.filter((i) => i.status === "Watching").length;
  const completedCount = watchlist.filter((i) => i.status === "Completed").length || watched.length;
  const planToWatchCount = watchlist.filter((i) => i.status === "Plan to Watch").length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-inter">
      {/* Birthday Celebration Banner */}
      {isBirthdayToday && (
        <div className="relative bg-gradient-to-r from-[#ffd700]/25 via-pink-500/20 to-purple-600/25 border-2 border-[#ffd700] rounded-2xl p-6 sm:p-8 text-center shadow-[0_0_30px_rgba(255,215,0,0.35)] backdrop-blur-md animate-pulse">
          <Cake size={44} className="mx-auto text-[#ffd700] mb-2" />
          <h2 className="text-2xl sm:text-3xl font-black font-montserrat text-white drop-shadow-md">
            🎉 Happy Birthday, {displayName || "Anime Fan"}! 🎂
          </h2>
          <p className="text-sm text-neutral-200 mt-2 max-w-lg mx-auto leading-relaxed">
            Wishing you a wonderful year filled with thrilling adventures, unforgettable stories, and great anime moments!
          </p>
        </div>
      )}

      {/* 30-Day Scheduled Deletion Active Warning Banner */}
      {deletionScheduled && scheduledDeletionDate && (
        <div className="relative bg-red-950/70 border-2 border-red-500 rounded-2xl p-5 sm:p-6 shadow-[0_0_25px_rgba(239,68,68,0.3)] backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <AlertTriangle size={28} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold font-montserrat text-red-200">
                Account Scheduled for Permanent Destruction
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
                (30-day grace period). Logging in or clicking below cancels this destruction.
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

      {/* Main Profile View Card */}
      <div className="relative bg-[#15151c]/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.3)] bg-neutral-800 flex-shrink-0 flex items-center justify-center">
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
                <User size={48} className="text-[#ffd700]" />
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-montserrat text-white truncate">
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
                      Born {formattedBirthDate}
                    </span>
                  </>
                )}
              </div>

              <p className="text-sm text-neutral-300 pt-1 leading-relaxed max-w-xl">
                {bio || "Anime enthusiast exploring legendary series and movies."}
              </p>

              {/* Mature Content Status */}
              <div className="pt-2 flex items-center gap-2 justify-center sm:justify-start text-xs">
                {isAdult ? (
                  allowMatureContent ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                      <ShieldCheck size={14} /> Mature Content Enabled (18+)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-neutral-400 font-semibold bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                      <ShieldAlert size={14} /> Standard Mode Active
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    <ShieldAlert size={14} /> Standard Mode (Under 18)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-2 bg-[#ffd700]/15 hover:bg-[#ffd700] text-[#ffd700] hover:text-black font-montserrat font-bold text-xs sm:text-sm px-4 py-2 rounded-xl border border-[#ffd700]/40 transition-all cursor-pointer"
            >
              {isEditing ? <X size={16} /> : <Edit3 size={16} />}
              <span>{isEditing ? "Close" : "Edit Profile"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white font-montserrat font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-red-500/30 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* User Watch Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 p-3.5 rounded-xl text-center border border-white/5">
            <Heart size={18} className="mx-auto text-red-400 mb-1" />
            <p className="font-staatliches text-2xl text-white">{favourites.length}</p>
            <p className="text-[11px] text-neutral-400 font-bold uppercase font-montserrat">Favorites</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl text-center border border-white/5">
            <Clock size={18} className="mx-auto text-blue-400 mb-1" />
            <p className="font-staatliches text-2xl text-white">{watchingCount}</p>
            <p className="text-[11px] text-neutral-400 font-bold uppercase font-montserrat">Watching</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl text-center border border-white/5">
            <CheckCircle size={18} className="mx-auto text-green-400 mb-1" />
            <p className="font-staatliches text-2xl text-white">{completedCount}</p>
            <p className="text-[11px] text-neutral-400 font-bold uppercase font-montserrat">Completed</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl text-center border border-white/5">
            <List size={18} className="mx-auto text-[#ffd700] mb-1" />
            <p className="font-staatliches text-2xl text-white">{planToWatchCount}</p>
            <p className="text-[11px] text-neutral-400 font-bold uppercase font-montserrat">Plan to Watch</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-[#15151c]/95 border border-[#ffd700]/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-xl font-extrabold font-montserrat text-[#ffd700] flex items-center gap-2">
              <Sparkles size={20} />
              <span>Edit Personal Details</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-neutral-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Avatar Presets */}
          <div>
            <label className="block text-xs font-bold uppercase font-montserrat text-neutral-300 mb-3">
              Choose Avatar
            </label>
            <div className="flex flex-wrap gap-4">
              {AVATAR_PRESETS.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt={`Avatar Option ${idx + 1}`}
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-14 h-14 rounded-full object-cover cursor-pointer border-2 transition-all hover:scale-110 ${
                    avatarUrl === preset
                      ? "border-[#ffd700] ring-4 ring-[#ffd700]/30 scale-105"
                      : "border-white/20 opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="profile-display-name" className="block text-xs font-bold uppercase font-montserrat text-neutral-300 mb-2">
              Display Name
            </label>
            <input
              id="profile-display-name"
              name="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 focus:border-[#ffd700] rounded-xl text-sm text-white outline-none"
            />
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
                  <ShieldCheck size={16} className={isAdult ? "text-emerald-400" : "text-neutral-500"} />
                  <span>Allow Mature Content (18+)</span>
                </label>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {isAdult
                    ? "Show 18+ and mature-rated anime titles in your feeds and searches."
                    : "You must be 18 or older based on your birth date to enable mature titles."}
                </p>
              </div>
              <input
                id="profile-allow-mature"
                name="allowMatureContent"
                type="checkbox"
                disabled={!isAdult}
                checked={isAdult && allowMatureContent}
                onChange={(e) => setAllowMatureContent(e.target.checked)}
                className="w-5 h-5 accent-[#ffd700] cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* About Me */}
          <div>
            <label htmlFor="profile-bio" className="block text-xs font-bold uppercase font-montserrat text-neutral-300 mb-2">
              About Me
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about your favorite anime, characters, and hobbies..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 focus:border-[#ffd700] rounded-xl text-sm text-white outline-none resize-y min-h-[90px]"
            />
          </div>

          {/* Favorite Category */}
          <div>
            <label htmlFor="profile-favorite-genre" className="block text-xs font-bold uppercase font-montserrat text-neutral-300 mb-2">
              Favorite Category
            </label>
            <select
              id="profile-favorite-genre"
              name="favoriteGenre"
              value={favoriteGenre}
              onChange={(e) => setFavoriteGenre(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-white/15 focus:border-[#ffd700] rounded-xl text-sm text-white outline-none cursor-pointer"
            >
              {["Shonen", "Action", "Adventure", "Fantasy", "Sci-Fi", "Comedy", "Drama", "Mystery"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Save & Cancel Row */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] disabled:opacity-50 text-black font-extrabold px-6 py-2.5 rounded-full text-sm font-montserrat shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                <Save size={16} />
                <span>{saving ? "Saving..." : "Save Profile"}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-full text-sm font-montserrat font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Danger Zone: Delete Account Trigger */}
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold font-montserrat text-red-400 hover:text-red-300 hover:underline cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete Account (30-Day Destruction)</span>
            </button>
          </div>
        </form>
      )}

      {/* Delete / Destruction Confirmation Modal with Password Verification */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181822] border-2 border-red-500/60 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-[0_15px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(239,68,68,0.25)]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400">
                  <AlertTriangle size={22} />
                </div>
                <h3 className="text-lg font-black font-montserrat text-white">
                  Schedule Account Destruction
                </h3>
              </div>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletePassword("");
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed bg-red-950/30 border border-red-500/20 p-3.5 rounded-xl">
              <p>
                <strong>30-Day Grace Period:</strong> Your account will be scheduled for permanent destruction in 30 days.
              </p>
              <p>
                If you change your mind, simply <strong>log in anytime within the next 30 days</strong> to automatically cancel the destruction and restore your profile!
              </p>
            </div>

            <form onSubmit={handleScheduleDelete} className="space-y-4">
              <div>
                <label
                  htmlFor="delete-verify-password"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase font-montserrat text-neutral-300 mb-2"
                >
                  <Lock size={14} className="text-red-400" />
                  <span>Verify Password to Confirm</span>
                </label>
                <input
                  id="delete-verify-password"
                  name="verifyPassword"
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-white/20 focus:border-red-500 rounded-xl text-sm text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setDeletePassword("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold font-montserrat text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Keep Account
                </button>
                <button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-montserrat font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>{deleting ? "Verifying..." : "Confirm Schedule (30 Days)"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
