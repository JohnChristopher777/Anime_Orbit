import * as React from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { safeImageUrl, sanitizeHandle, sanitizeInput } from "../utils/security";
import { useProfileIdentity } from "./useProfileIdentity";

export interface PublicCommunityIdentity {
  displayName: string;
  avatarUrl: string;
  profileHandle: string;
}

const usableAvatar = (value: unknown) => {
  const avatar = safeImageUrl(value);
  return avatar === "/icon.png" ? "" : avatar;
};

/** Resolve stored community posts through the author's live public profile. */
export function usePublicCommunityIdentities(entries: any[]) {
  const { currentUser } = useAuth();
  const ownIdentity = useProfileIdentity();
  const userIds = React.useMemo(
    () => [...new Set(entries.map((entry) => String(entry?.userId || "")).filter(Boolean))].slice(0, 60),
    [entries.map((entry) => entry?.userId).join("|")],
  );
  const idsKey = userIds.join("|");
  const [identities, setIdentities] = React.useState<Record<string, PublicCommunityIdentity>>({});

  React.useEffect(() => {
    setIdentities({});
    const unsubscribes = userIds.map((userId) =>
      onSnapshot(
        doc(db, "publicProfiles", userId),
        (snapshot) => {
          if (!snapshot.exists()) return;
          const profile = snapshot.data();
          setIdentities((current) => ({
            ...current,
            [userId]: {
              displayName: sanitizeInput(profile.displayName || "Anime Fan", 30),
              avatarUrl: usableAvatar(profile.avatarUrl),
              profileHandle: sanitizeHandle(profile.userId) || userId,
            },
          }));
        },
        () => {},
      ),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [idsKey]);

  return React.useMemo(() => {
    if (!currentUser) return identities;
    return {
      ...identities,
      [currentUser.uid]: {
        displayName: ownIdentity.displayName,
        avatarUrl: usableAvatar(ownIdentity.avatarUrl),
        profileHandle: ownIdentity.profileHandle || currentUser.uid,
      },
    };
  }, [currentUser, identities, ownIdentity]);
}

export const resolveCommunityIdentity = (
  entry: any,
  identities: Record<string, PublicCommunityIdentity>,
): PublicCommunityIdentity => {
  const live = identities[String(entry?.userId || "")];
  return {
    displayName: live?.displayName || sanitizeInput(entry?.userName || "Anime Fan", 30),
    avatarUrl: live?.avatarUrl || usableAvatar(entry?.userAvatar),
    profileHandle:
      live?.profileHandle ||
      sanitizeHandle(entry?.profileHandle) ||
      String(entry?.userId || ""),
  };
};

