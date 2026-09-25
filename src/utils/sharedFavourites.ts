import type { FavouriteAnime } from "../context/FavouritesContext";
import { sanitizeSharedOwner, type SharedOwner } from "./shareOwner";

export type SharedFavouriteMediaType = "anime" | "manga";

export interface SharedFavouriteTier {
  id: string;
  name: string;
  color: string;
  textColor: string;
  itemIds: number[];
}

export interface SharedFavouriteItem {
  id: number;
  title: string;
  image: string;
  format: string;
  rank: number | null;
  userScore: number | null;
  catalogueScore: number | null;
}

export interface SharedFavouritesPayload {
  version: 1;
  title?: string;
  mediaType: SharedFavouriteMediaType;
  createdAt: string;
  owner: SharedOwner | null;
  tiers: SharedFavouriteTier[];
  waitingItemIds: number[];
  items: SharedFavouriteItem[];
}

interface TierInput {
  id: string;
  name: string;
  color: string;
  textColor: string;
  animeIds: number[];
}

const finiteNumber = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : 0;
};

const safeColor = (value: unknown, fallback: string) =>
  /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value) : fallback;

const safeImageUrl = (value: unknown) => {
  try {
    const parsed = new URL(String(value || ""));
    if (parsed.protocol !== "https:") return "";
    const hosts = ["s4.anilist.co", "media.kitsu.app", "cdn.myanimelist.net"];
    return hosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
      ? parsed.href.slice(0, 700)
      : "";
  } catch {
    return "";
  }
};

export const createSharedFavouritesPayload = (
  favourites: FavouriteAnime[],
  tiers: TierInput[],
  mediaType: SharedFavouriteMediaType,
  userScores: Map<number, number>,
  owner: SharedOwner | null,
  title = "My tier list",
): SharedFavouritesPayload => {
  const safeFavourites = favourites.slice(0, 250);
  const availableIds = new Set(safeFavourites.map((item) => Number(item.mal_id)));
  const seenIds = new Set<number>();
  let rank = 1;
  const ranks = new Map<number, number>();
  const safeTiers = tiers.slice(0, 20).map((tier, index) => {
    const itemIds = tier.animeIds
      .map(Number)
      .filter((id) => availableIds.has(id) && !seenIds.has(id))
      .slice(0, 250);
    itemIds.forEach((id) => {
      seenIds.add(id);
      ranks.set(id, rank++);
    });
    return {
      id: String(tier.id || `tier-${index}`).slice(0, 50),
      name: String(tier.name || `Tier ${index + 1}`).trim().slice(0, 24),
      color: safeColor(tier.color, "#ffd700"),
      textColor: safeColor(tier.textColor, "#000000"),
      itemIds,
    };
  });
  const waitingItemIds = safeFavourites
    .map((item) => Number(item.mal_id))
    .filter((id) => id > 0 && !seenIds.has(id));

  return {
    version: 1,
    title: String(title || "My tier list").trim().slice(0, 40),
    mediaType,
    createdAt: new Date().toISOString(),
    owner: sanitizeSharedOwner(owner),
    tiers: safeTiers,
    waitingItemIds,
    items: safeFavourites.map((item) => {
      const id = finiteNumber(item.mal_id, 1);
      const userScore = finiteNumber(userScores.get(id), 0, 10);
      const catalogueScore = finiteNumber(item.score, 0, 10);
      return {
        id,
        title: String(item.title || item.title_english || "Untitled").trim().slice(0, 180),
        image: safeImageUrl(item.image),
        format: String(item.format || (mediaType === "manga" ? "Manga" : "Anime")).slice(0, 40),
        rank: ranks.get(id) || null,
        userScore: userScore > 0 ? userScore : null,
        catalogueScore: catalogueScore > 0 ? catalogueScore : null,
      };
    }).filter((item) => item.id > 0),
  };
};

export const encodeSharedFavourites = (payload: SharedFavouritesPayload) => {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const decodeSharedFavourites = (encoded: string): SharedFavouritesPayload | null => {
  if (!encoded || encoded.length > 120000) return null;
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const parsed = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))));
    if (parsed?.version !== 1 || !["anime", "manga"].includes(parsed.mediaType) || !Array.isArray(parsed.items) || !Array.isArray(parsed.tiers)) return null;
    const items: SharedFavouriteItem[] = parsed.items.slice(0, 250).map((item: any) => ({
      id: finiteNumber(item?.id, 1),
      title: String(item?.title || "Untitled").slice(0, 180),
      image: safeImageUrl(item?.image),
      format: String(item?.format || "").slice(0, 40),
      rank: finiteNumber(item?.rank, 0, 250) || null,
      userScore: finiteNumber(item?.userScore, 0, 10) || null,
      catalogueScore: finiteNumber(item?.catalogueScore, 0, 10) || null,
    })).filter((item: SharedFavouriteItem) => item.id > 0);
    const ids = new Set(items.map((item) => item.id));
    const tiers: SharedFavouriteTier[] = parsed.tiers.slice(0, 20).map((tier: any, index: number) => ({
      id: String(tier?.id || `tier-${index}`).slice(0, 50),
      name: String(tier?.name || `Tier ${index + 1}`).slice(0, 24),
      color: safeColor(tier?.color, "#ffd700"),
      textColor: safeColor(tier?.textColor, "#000000"),
      itemIds: Array.isArray(tier?.itemIds) ? tier.itemIds.map(Number).filter((id: number) => ids.has(id)).slice(0, 250) : [],
    }));
    return {
      version: 1,
      title: String(parsed.title || "Shared tier list").trim().slice(0, 40),
      mediaType: parsed.mediaType,
      createdAt: String(parsed.createdAt || "").slice(0, 40),
      owner: sanitizeSharedOwner(parsed.owner),
      tiers,
      waitingItemIds: Array.isArray(parsed.waitingItemIds) ? parsed.waitingItemIds.map(Number).filter((id: number) => ids.has(id)).slice(0, 250) : [],
      items,
    };
  } catch {
    return null;
  }
};
