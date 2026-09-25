import type { MangaWatchlistItem, WatchlistItem } from "../context/WatchlistContext";
import { sanitizeSharedOwner, type SharedOwner } from "./shareOwner";

export type SharedMediaType = "anime" | "manga";

export interface SharedListItem {
  id: number;
  title: string;
  image: string;
  status: string;
  progress: number;
  total: number;
  userScore: number | null;
  catalogueScore: number | null;
  format: string;
}

export interface SharedListPayload {
  version: 1;
  mediaType: SharedMediaType;
  createdAt: string;
  owner: SharedOwner | null;
  items: SharedListItem[];
}

const statusOrder = (status = "") => {
  const value = status.trim().toLowerCase();
  if (value === "completed") return 0;
  if (value === "watching" || value === "reading" || value === "caught up") return 1;
  if (value === "plan to watch" || value === "plan to read") return 2;
  if (value === "on hold") return 3;
  if (value === "dropped") return 4;
  return 5;
};

const oldestTimestamp = (item: WatchlistItem | MangaWatchlistItem) => {
  const value = Date.parse(item.addedAt || item.startDate || item.updatedAt || "9999-12-31");
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
};

const finiteNumber = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : 0;
};

const safeImageUrl = (value: unknown) => {
  try {
    const parsed = new URL(String(value || ""));
    if (parsed.protocol !== "https:") return "";
    const allowedHosts = ["s4.anilist.co", "media.kitsu.app", "cdn.myanimelist.net"];
    return allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
      ? parsed.href.slice(0, 700)
      : "";
  } catch {
    return "";
  }
};

export const sortSharedListItems = <T extends WatchlistItem | MangaWatchlistItem>(
  items: T[],
  _mediaType: SharedMediaType,
) => [...items].sort((left, right) => {
  const statusDifference = statusOrder(left.status) - statusOrder(right.status);
  return statusDifference || oldestTimestamp(left) - oldestTimestamp(right) || Number(left.mal_id) - Number(right.mal_id);
});

export const createSharedListPayload = (
  items: Array<WatchlistItem | MangaWatchlistItem>,
  mediaType: SharedMediaType,
  owner: SharedOwner | null = null,
): SharedListPayload => ({
  version: 1,
  mediaType,
  createdAt: new Date().toISOString(),
  owner: sanitizeSharedOwner(owner),
  items: sortSharedListItems(items, mediaType).slice(0, 250).map((item) => {
    const runtimeItem = item as WatchlistItem & MangaWatchlistItem & { images?: { jpg?: { large_image_url?: string; image_url?: string } } };
    const total = mediaType === "manga" ? runtimeItem.chapters : runtimeItem.episodes;
    const userScore = finiteNumber(item.userScore, 0, 10);
    const catalogueScore = finiteNumber(item.score, 0, 10);
    return {
      id: finiteNumber(item.mal_id, 1),
      title: String(item.title || item.title_english || "Untitled").trim().slice(0, 180),
      image: safeImageUrl(runtimeItem.images?.jpg?.large_image_url || runtimeItem.images?.jpg?.image_url || item.image_url || item.image),
      status: String(item.status || (mediaType === "manga" ? "Plan to Read" : "Plan to Watch")).trim().slice(0, 32),
      progress: finiteNumber(item.progress, 0, 100000),
      total: finiteNumber(total, 0, 100000),
      userScore: userScore > 0 ? userScore : null,
      catalogueScore: catalogueScore > 0 ? catalogueScore : null,
      format: String(mediaType === "manga" ? runtimeItem.format || "Manga" : item.type || "Anime").slice(0, 40),
    };
  }),
});

export const encodeSharedList = (payload: SharedListPayload) => {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const decodeSharedList = (encoded: string): SharedListPayload | null => {
  if (!encoded || encoded.length > 120000) return null;
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (parsed?.version !== 1 || !["anime", "manga"].includes(parsed.mediaType) || !Array.isArray(parsed.items)) return null;
    const items = parsed.items.slice(0, 250).map((item: any) => ({
      id: finiteNumber(item?.id, 1),
      title: String(item?.title || "Untitled").slice(0, 180),
      image: safeImageUrl(item?.image),
      status: String(item?.status || "Unknown").slice(0, 32),
      progress: finiteNumber(item?.progress, 0, 100000),
      total: finiteNumber(item?.total, 0, 100000),
      userScore: finiteNumber(item?.userScore, 0, 10) || null,
      catalogueScore: finiteNumber(item?.catalogueScore, 0, 10) || null,
      format: String(item?.format || "Anime").slice(0, 40),
    })).filter((item: SharedListItem) => item.id > 0 && item.title);
    return {
      version: 1,
      mediaType: parsed.mediaType,
      createdAt: String(parsed.createdAt || "").slice(0, 40),
      owner: sanitizeSharedOwner(parsed.owner),
      items,
    };
  } catch {
    return null;
  }
};
