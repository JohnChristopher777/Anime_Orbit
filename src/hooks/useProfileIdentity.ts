import * as React from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { safeImageUrl, sanitizeHandle, sanitizeInput } from "../utils/security";

export interface ProfileIdentity {
  displayName: string;
  avatarUrl: string;
  bannerUrl: string;
  profileHandle: string;
}

const emptyIdentity: ProfileIdentity = {
  displayName: "Anime Fan",
  avatarUrl: "",
  bannerUrl: "",
  profileHandle: "",
};

export function useProfileIdentity(): ProfileIdentity {
  const { currentUser } = useAuth();
  const [identity, setIdentity] = React.useState<ProfileIdentity>(emptyIdentity);

  React.useEffect(() => {
    if (!currentUser) {
      setIdentity(emptyIdentity);
      return;
    }

    const fallbackName = sanitizeInput(
      currentUser.displayName || currentUser.email?.split("@")[0] || "Anime Fan",
      15,
    );
    setIdentity({
      displayName: fallbackName,
      avatarUrl: safeImageUrl(currentUser.photoURL),
      bannerUrl: "",
      profileHandle: currentUser.uid,
    });

    let active = true;
    getDoc(doc(db, "users", currentUser.uid))
      .then((snapshot) => {
        if (!active || !snapshot.exists()) return;
        const profile = snapshot.data();
        setIdentity({
          displayName: sanitizeInput(profile.displayName, 15) || fallbackName,
          avatarUrl: safeImageUrl(profile.avatarUrl),
          bannerUrl: safeImageUrl(profile.bannerUrl),
          profileHandle: sanitizeHandle(profile.userId) || currentUser.uid,
        });
      })
      .catch(() => {});

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<Partial<ProfileIdentity>>).detail || {};
      setIdentity((current) => ({
        displayName:
          detail.displayName === undefined
            ? current.displayName
            : sanitizeInput(detail.displayName, 15) || fallbackName,
        avatarUrl:
          detail.avatarUrl === undefined ? current.avatarUrl : safeImageUrl(detail.avatarUrl),
        bannerUrl:
          detail.bannerUrl === undefined ? current.bannerUrl : safeImageUrl(detail.bannerUrl),
        profileHandle:
          detail.profileHandle === undefined
            ? current.profileHandle
            : sanitizeHandle(detail.profileHandle),
      }));
    };

    window.addEventListener("orbit_profile_updated", handleUpdate);
    return () => {
      active = false;
      window.removeEventListener("orbit_profile_updated", handleUpdate);
    };
  }, [currentUser]);

  return identity;
}
