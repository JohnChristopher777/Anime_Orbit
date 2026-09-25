import React from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { sanitizeSharedOwner, type SharedOwner } from "../utils/shareOwner";

export const usePublicShareOwner = () => {
  const { currentUser } = useAuth();
  const [owner, setOwner] = React.useState<SharedOwner | null>(null);

  React.useEffect(() => {
    if (!currentUser) {
      setOwner(null);
      return;
    }
    let active = true;
    setOwner(sanitizeSharedOwner({
      displayName: currentUser.displayName || "Anime fan",
      avatarUrl: currentUser.photoURL || "",
      profileHandle: "",
    }));
    getDoc(doc(db, "publicProfiles", currentUser.uid)).then((snapshot) => {
      if (!active || !snapshot.exists()) return;
      const profile = snapshot.data();
      setOwner(sanitizeSharedOwner({
        displayName: profile.displayName || currentUser.displayName,
        avatarUrl: profile.avatarUrl || currentUser.photoURL,
        profileHandle: profile.userId,
      }));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [currentUser]);

  return owner;
};
