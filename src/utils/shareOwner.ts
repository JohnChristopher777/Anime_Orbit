export interface SharedOwner {
  displayName: string;
  avatarUrl: string;
  bannerUrl: string;
  profileHandle: string;
}

const safePublicImage = (value: unknown) => {
  const candidate = String(value || "").trim().slice(0, 700);
  if (/^\/(?:icon|banner)\/[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp|gif)$/i.test(candidate)) return candidate;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
};

export const sanitizeSharedOwner = (value: unknown): SharedOwner | null => {
  if (!value || typeof value !== "object") return null;
  const owner = value as Partial<SharedOwner>;
  const displayName = String(owner.displayName || "Anime fan").trim().slice(0, 30);
  const profileHandle = String(owner.profileHandle || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  return {
    displayName: displayName || "Anime fan",
    avatarUrl: safePublicImage(owner.avatarUrl),
    bannerUrl: safePublicImage(owner.bannerUrl),
    profileHandle,
  };
};
