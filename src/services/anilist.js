const ANILIST_API_URL = import.meta.env.VITE_ANILIST_API_URL || "https://graphql.anilist.co";
const KITSU_API_URL = "https://kitsu.io/api/edge";
const JIKAN_API_URL = "https://api.jikan.moe/v4";
const QUERY_CACHE_MS = 5 * 60 * 1000;
const queryCache = new Map();
const kitsuCache = new Map();
const jikanCache = new Map();
const mangaMetadataCache = new Map();

async function queryKitsu(path) {
  const now = Date.now();
  const cached = kitsuCache.get(path);
  if (cached && cached.expiresAt > now) return cached.promise;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  const request = fetch(`${KITSU_API_URL}${path}`, {
    signal: controller.signal,
    headers: { Accept: "application/vnd.api+json" },
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Kitsu API Error: ${response.status}`);
    return response.json();
  }).catch((error) => {
    kitsuCache.delete(path);
    throw error;
  }).finally(() => clearTimeout(timeout));

  kitsuCache.set(path, { expiresAt: now + QUERY_CACHE_MS, promise: request });
  return request;
}

async function queryJikan(path) {
  const now = Date.now();
  const cached = jikanCache.get(path);
  if (cached && cached.expiresAt > now) return cached.promise;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  const request = fetch(`${JIKAN_API_URL}${path}`, {
    signal: controller.signal,
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    return response.json();
  }).catch((error) => {
    jikanCache.delete(path);
    throw error;
  }).finally(() => clearTimeout(timeout));

  jikanCache.set(path, { expiresAt: now + QUERY_CACHE_MS, promise: request });
  return request;
}

async function queryMangaMetadata(malId, title) {
  const key = `${malId || ""}:${normaliseTitle(title)}`;
  const now = Date.now();
  const cached = mangaMetadataCache.get(key);
  if (cached && cached.expiresAt > now) return cached.promise;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  const params = new URLSearchParams();
  if (malId) params.set("malId", String(malId));
  if (title) params.set("title", title);
  const request = fetch(`/api/manga-metadata?${params.toString()}`, {
    signal: controller.signal,
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Manga metadata endpoint error: ${response.status}`);
    return response.json();
  }).catch((error) => {
    mangaMetadataCache.delete(key);
    throw error;
  }).finally(() => clearTimeout(timeout));
  mangaMetadataCache.set(key, { expiresAt: now + QUERY_CACHE_MS, promise: request });
  return request;
}

async function getMangaDexChapterCount(malId, title) {
  if (!malId && !title) return 0;
  const metadata = await queryMangaMetadata(malId, title);
  return positiveNumber(metadata?.chapterCount);
}

async function queryKitsuGuideRange(resourceType, mediaId, childType, offset, limit) {
  const data = [];
  let meta = {};
  let remaining = limit;
  let nextOffset = offset;

  // Kitsu rejects relationship requests above 20 even though the surrounding
  // interface uses 50-item ranges. Fetch small accepted chunks and merge them.
  while (remaining > 0) {
    const chunkSize = Math.min(20, remaining);
    const response = await queryKitsu(`/${resourceType}/${mediaId}/${childType}?page[limit]=${chunkSize}&page[offset]=${nextOffset}`);
    if (!Object.keys(meta).length) meta = response?.meta || {};
    data.push(...(response?.data || []));
    if ((response?.data || []).length < chunkSize) break;
    remaining -= chunkSize;
    nextOffset += chunkSize;
  }
  return { data, meta };
}

async function getJikanEpisodeRange(malId, offset, limit) {
  if (!positiveNumber(malId)) return [];
  // Jikan exposes 100 episode records per page. Translate our 50-item UI ranges
  // to the corresponding API page, then keep only the requested numbers.
  const apiPage = Math.floor(offset / 100) + 1;
  const response = await queryJikan(`/anime/${malId}/episodes?page=${apiPage}`);
  const first = offset + 1;
  const last = offset + limit;
  return (response?.data || []).map((episode) => {
    const number = positiveNumber(episode.mal_id);
    const title = episode.title || episode.title_romanji || episode.title_japanese || "";
    return {
      mal_id: number,
      number,
      title: title || `Episode ${number}`,
      summary: "",
      thumbnail: "",
      aired: episode.aired || null,
      filler: Boolean(episode.filler),
      recap: Boolean(episode.recap),
      forumUrl: episode.forum_url || "",
      metadataAvailable: Boolean(title || episode.aired),
    };
  }).filter((episode) => episode.number >= first && episode.number <= last);
}

function positiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normaliseTitle(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function resolveKitsuMedia(mediaType, malId, title, knownKitsuId) {
  const resourceType = mediaType === "MANGA" ? "manga" : "anime";
  if (knownKitsuId) {
    const response = await queryKitsu(`/${resourceType}/${knownKitsuId}`);
    return response?.data || null;
  }

  if (malId) {
    try {
      const externalSite = `myanimelist/${resourceType}`;
      const response = await queryKitsu(`/mappings?filter[externalSite]=${encodeURIComponent(externalSite)}&filter[externalId]=${encodeURIComponent(malId)}&include=item`);
      const included = response?.included?.find((item) => item.type === resourceType);
      const relatedId = response?.data?.[0]?.relationships?.item?.data?.id;
      if (included) return included;
      if (relatedId) {
        const related = await queryKitsu(`/${resourceType}/${relatedId}`);
        if (related?.data) return related.data;
      }
    } catch {
      // Some older records have no usable external mapping; exact-title search is the fallback.
    }
  }

  if (!title) return null;
  const response = await queryKitsu(`/${resourceType}?filter[text]=${encodeURIComponent(title)}&page[limit]=5`);
  const candidates = response?.data || [];
  const wanted = normaliseTitle(title);
  return candidates.find((entry) => {
    const attributes = entry.attributes || {};
    return [attributes.canonicalTitle, attributes.titles?.en, attributes.titles?.en_jp]
      .filter(Boolean)
      .some((candidate) => normaliseTitle(candidate) === wanted);
  }) || candidates[0] || null;
}

export async function getMediaGuidePage({ mediaType = "ANIME", malId, title, kitsuId, page = 1, perPage = 24, fallbackCount = 0 }) {
  const normalizedType = mediaType === "MANGA" ? "MANGA" : "ANIME";
  const resourceType = normalizedType === "MANGA" ? "manga" : "anime";
  const childType = normalizedType === "MANGA" ? "chapters" : "episodes";
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(perPage) || 24));
  const offset = (safePage - 1) * safeLimit;
  let jikanItems = [];
  let mangaDexCount = 0;

  if (normalizedType === "ANIME" && malId) {
    try {
      jikanItems = await getJikanEpisodeRange(malId, offset, safeLimit);
    } catch (error) {
      console.warn("Jikan episode metadata unavailable; continuing with other sources.", error);
    }
  }
  if (normalizedType === "MANGA" && !positiveNumber(fallbackCount)) {
    try {
      mangaDexCount = await getMangaDexChapterCount(malId, title);
    } catch (error) {
      console.warn("MangaDex chapter count unavailable; continuing with AniList/Kitsu.", error);
    }
  }

  try {
    const media = await resolveKitsuMedia(normalizedType, malId, title, kitsuId);
    if (!media?.id) return { kitsuId: null, totalCount: positiveNumber(fallbackCount) || mangaDexCount, items: jikanItems, trailerId: null };

    let guide = { data: [], meta: {} };
    try {
      guide = await queryKitsuGuideRange(resourceType, media.id, childType, offset, safeLimit);
    } catch (error) {
      console.warn(`Kitsu ${childType} unavailable; using available catalogue metadata.`, error);
    }
    const attributeCount = normalizedType === "MANGA"
      ? positiveNumber(media.attributes?.chapterCount)
      : positiveNumber(media.attributes?.episodeCount);
    // AniList remains authoritative when it publishes a total (including the
    // current episode inferred from nextAiringEpisode). Kitsu relationship
    // counts can include unaired/stub records, so they are only a fallback.
    const authoritativeCount = positiveNumber(fallbackCount);
    const totalCount = normalizedType === "MANGA"
      ? authoritativeCount || mangaDexCount || attributeCount
      : authoritativeCount || Math.max(positiveNumber(guide?.meta?.count), attributeCount);
    const kitsuItems = (guide?.data || []).map((entry) => {
      const attributes = entry.attributes || {};
      const number = positiveNumber(attributes.number);
      const publishedTitle = attributes.canonicalTitle || attributes.titles?.en || attributes.titles?.en_us || attributes.titles?.en_jp || "";
      const thumbnail = attributes.thumbnail?.original || attributes.thumbnail?.large || "";
      return {
        mal_id: number || entry.id,
        number,
        title: publishedTitle || `${normalizedType === "MANGA" ? "Chapter" : "Episode"} ${number || entry.id}`,
        summary: attributes.synopsis || "",
        thumbnail,
        aired: attributes.airdate || attributes.published || null,
        length: positiveNumber(attributes.length),
        metadataAvailable: Boolean(publishedTitle || attributes.synopsis || thumbnail || attributes.airdate || attributes.published),
      };
    }).filter((item) => item.number > 0);

    const itemsByNumber = new Map(jikanItems.map((item) => [item.number, item]));
    kitsuItems.forEach((item) => {
      const secondary = itemsByNumber.get(item.number) || {};
      itemsByNumber.set(item.number, {
        ...secondary,
        ...item,
        title: item.metadataAvailable && !/^Episode \d+$/i.test(item.title) ? item.title : secondary.title || item.title,
        aired: item.aired || secondary.aired || null,
        metadataAvailable: Boolean(item.metadataAvailable || secondary.metadataAvailable),
      });
    });
    const items = [...itemsByNumber.values()].sort((a, b) => a.number - b.number);

    return {
      kitsuId: media.id,
      totalCount,
      items,
      trailerId: normalizedType === "ANIME" ? media.attributes?.youtubeVideoId || null : null,
    };
  } catch (error) {
    console.warn("Supplemental media guide unavailable; using AniList metadata.", error);
    return { kitsuId: kitsuId || null, totalCount: positiveNumber(fallbackCount) || mangaDexCount, items: jikanItems, trailerId: null };
  }
}

async function queryAniList(query, variables = {}) {
  const cacheKey = JSON.stringify([query, variables]);
  const now = Date.now();
  const cached = queryCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.promise;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const request = fetch(ANILIST_API_URL, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  }).then(async (response) => {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AniList GraphQL Error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    if (json.errors) {
      throw new Error(`AniList GraphQL Errors: ${JSON.stringify(json.errors)}`);
    }

    return json.data;
  }).catch((error) => {
    queryCache.delete(cacheKey);
    throw error;
  }).finally(() => clearTimeout(timeout));

  queryCache.set(cacheKey, { expiresAt: now + QUERY_CACHE_MS, promise: request });
  if (queryCache.size > 100) {
    for (const [key, value] of queryCache) {
      if (value.expiresAt <= now) queryCache.delete(key);
    }
  }

  return request;
}

// Helper: Strip HTML tags from description/synopsis
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

// Helper: Map formats
function mapFormat(format) {
  if (!format) return "N/A";
  const formats = {
    TV: "TV",
    TV_SHORT: "TV Short",
    MOVIE: "Movie",
    SPECIAL: "Special",
    OVA: "OVA",
    ONA: "ONA",
    MUSIC: "Music"
  };
  return formats[format] || format;
}

function mapMangaFormat(format, countryOfOrigin) {
  if (format === "NOVEL") return "Light Novel";
  if (format === "ONE_SHOT") return "One-shot";
  if (countryOfOrigin === "KR") return "Manhwa";
  if (countryOfOrigin === "CN" || countryOfOrigin === "TW") return "Manhua";
  return format === "MANGA" ? "Manga" : mapFormat(format) || "Manga";
}

function mapMediaFormat(format, countryOfOrigin, mediaType) {
  return mediaType === "MANGA" ? mapMangaFormat(format, countryOfOrigin) : mapFormat(format);
}

// Helper: Map status
function mapStatus(status) {
  if (!status) return "N/A";
  const statuses = {
    FINISHED: "Finished Airing",
    RELEASING: "Currently Airing",
    NOT_YET_RELEASED: "Not yet aired",
    CANCELLED: "Cancelled",
    HIATUS: "On Hiatus"
  };
  return statuses[status] || status;
}

// Helper: Map source
function mapSource(source) {
  if (!source) return null;
  return source.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// Core media mapper from AniList to Jikan schema
function mapAniListAnimeToJikan(media) {
  if (!media) return {};

  const displayTitle = media.title.english || media.title.romaji || media.title.userPreferred || "Unknown Title";

  // Attempt to find rankings
  const rankObj = media.rankings?.find(r => r.allTime && r.type === "RATED");
  const popularityObj = media.rankings?.find(r => r.allTime && r.type === "POPULAR");

  const formattedDate = media.startDate && media.startDate.year
    ? `${media.startDate.year}-${media.startDate.month ? String(media.startDate.month).padStart(2, '0') : '01'}-${media.startDate.day ? String(media.startDate.day).padStart(2, '0') : '01'}`
    : "Not Available";

  const mainStudios = media.studios?.edges?.filter(e => e.isMain).map(e => ({ mal_id: e.node.id, name: e.node.name })) || [];
  const producerStudios = media.studios?.edges?.filter(e => !e.isMain).map(e => ({ mal_id: e.node.id, name: e.node.name })) || [];
  const allStudiosNodes = media.studios?.nodes?.map(s => ({ mal_id: s.id, name: s.name })) || [];

  // Ongoing series (e.g. One Piece, Detective Conan) have null/0 episodes in AniList - calculate from nextAiringEpisode or streamingEpisodes
  let resolvedEpisodes = media.episodes;
  if (!resolvedEpisodes || resolvedEpisodes === 0) {
    if (media.nextAiringEpisode?.episode) {
      resolvedEpisodes = media.nextAiringEpisode.episode - 1;
    } else if (media.streamingEpisodes?.length > 0) {
      resolvedEpisodes = media.streamingEpisodes.length;
    } else {
      resolvedEpisodes = null;
    }
  }

  const finalStudios = mainStudios.length > 0 ? mainStudios : (allStudiosNodes.slice(0, 2));
  const finalProducers = producerStudios.length > 0 ? producerStudios : (allStudiosNodes.slice(2));

  return {
    mal_id: media.id,
    malId: media.idMal || null,
    title: displayTitle,
    title_english: media.title.english || displayTitle,
    title_japanese: media.title.native || "",
    synopsis: stripHtml(media.description),
    banner_image: media.bannerImage || "",
    images: {
      jpg: {
        large_image_url: media.coverImage?.extraLarge || media.coverImage?.large || "",
        image_url: media.coverImage?.large || media.coverImage?.medium || "",
        small_image_url: media.coverImage?.medium || "",
        banner_image: media.bannerImage || "",
      }
    },
    score: media.averageScore ? (media.averageScore / 10).toFixed(1) : null,
    scored_by: media.popularity || 0,
    rank: rankObj ? rankObj.rank : null,
    popularity: popularityObj ? popularityObj.rank : null,
    type: mapFormat(media.format),
    episodes: resolvedEpisodes,
    isOngoing: media.status === "RELEASING",
    status: mapStatus(media.status),
    duration: media.duration ? `${media.duration} min` : null,
    genres: media.genres?.map((g, index) => ({ mal_id: index, name: g })) || [],
    studios: finalStudios,
    producers: finalProducers,
    source: mapSource(media.source),
    year: media.seasonYear || null,
    aired: {
      string: formattedDate,
    },
    rating: media.isAdult ? "Rx - Hentai" : "PG-13 - Teens 13 or older",
    trailer: media.trailer && media.trailer.site === "youtube" ? {
      youtube_id: media.trailer.id,
      url: `https://www.youtube.com/watch?v=${media.trailer.id}`,
      embed_url: `https://www.youtube.com/embed/${media.trailer.id}`
    } : null
  };
}

// Characters mapping
function mapAniListCharactersToJikan(edges) {
  if (!edges) return [];
  return edges.map(edge => ({
    role: edge.role,
    character: {
      mal_id: edge.node.id,
      name: edge.node.name.full,
      images: {
        jpg: {
          image_url: edge.node.image?.large || edge.node.image?.medium || ""
        }
      }
    },
    voice_actors: edge.voiceActors?.map(va => ({
      person: {
        name: va.name.full,
        images: {
          jpg: {
            image_url: va.image?.large || va.image?.medium || ""
          }
        }
      },
      language: va.language || "Japanese"
    })) || []
  }));
}

// Staff mapping
function mapAniListStaffToJikan(edges) {
  if (!edges) return [];
  return edges.map(edge => ({
    person: {
      name: edge.node.name.full,
      images: {
        jpg: {
          image_url: edge.node.image?.large || edge.node.image?.medium || ""
        }
      }
    },
    positions: [edge.role || "Staff"]
  }));
}

// Priority mapping for relations
const RELATION_PRIORITY = {
  ADAPTATION: 1,
  SOURCE: 1,
  PREQUEL: 2,
  SEQUEL: 3,
  PARENT: 4,
  SIDE_STORY: 5,
  SUMMARY: 6,
  ALTERNATIVE: 7,
  SPIN_OFF: 8,
  OTHER: 9,
  CHARACTER: 10,
};

// Relations mapping with strict priority ordering (Source/Manga -> Prequel -> Sequel -> Movies/OVAs/Spin-offs)
function mapAniListRelationsToJikan(edges) {
  if (!edges) return [];

  // Sort edges by established priority
  const sortedEdges = [...edges].sort((a, b) => {
    const pA = RELATION_PRIORITY[a.relationType] || 99;
    const pB = RELATION_PRIORITY[b.relationType] || 99;
    return pA - pB;
  });

  const groups = {};
  sortedEdges.forEach(edge => {
    const relType = edge.relationType.replace(/_/g, " ").toLowerCase();
    const relationName = relType.replace(/\b\w/g, c => c.toUpperCase());
    
    if (!groups[relationName]) {
      groups[relationName] = [];
    }
    groups[relationName].push({
      mal_id: edge.node.id,
      name: edge.node.title.english || edge.node.title.romaji || edge.node.title.userPreferred || "Unknown Title",
      type: mapMediaFormat(edge.node.format, edge.node.countryOfOrigin, edge.node.type) || edge.node.type || "N/A",
      format: mapMediaFormat(edge.node.format, edge.node.countryOfOrigin, edge.node.type),
      status: mapStatus(edge.node.status),
      score: edge.node.averageScore ? (edge.node.averageScore / 10).toFixed(1) : null,
      image: edge.node.coverImage?.extraLarge || edge.node.coverImage?.large || edge.node.coverImage?.medium || ""
    });
  });
  
  return Object.keys(groups).map(rel => ({
    relation: rel,
    entry: groups[rel]
  }));
}

// Episodes mapping (Supports up to 1000+ episodes like One Piece, merging streaming links with full list)
function mapAniListEpisodesToJikan(streamingEpisodes, totalEpisodes) {
  const streamMap = new Map();
  if (streamingEpisodes && streamingEpisodes.length > 0) {
    streamingEpisodes.forEach((ep, idx) => {
      const match = ep.title.match(/(?:Episode|Ep)\s*(\d+)/i);
      const num = match ? parseInt(match[1]) : idx + 1;
      streamMap.set(num, ep);
    });
  }

  const count = Math.max(totalEpisodes || 0, streamingEpisodes?.length || 0);
  const finalEpisodes = [];

  // Generate episodes with rich stream data where available
  for (let i = 1; i <= count; i++) {
    const stream = streamMap.get(i);
    finalEpisodes.push({
      mal_id: i,
      title: stream?.title || `Episode ${i}`,
      thumbnail: stream?.thumbnail || "",
      url: stream?.url || "",
      site: stream?.site || "",
      aired: null,
      summary: stream?.title ? `${stream.title} - Official broadcast episode.` : "",
      metadataAvailable: Boolean(stream?.title || stream?.thumbnail || stream?.url),
    });
  }

  return finalEpisodes;
}

const ANIME_FIELDS = `
  id
  description
  bannerImage
  title {
    english
    romaji
    native
    userPreferred
  }
  coverImage {
    extraLarge
    large
    medium
  }
  averageScore
  popularity
  format
  episodes
  status
  duration
  genres
  seasonYear
  startDate {
    year
    month
    day
  }
  rankings {
    rank
    type
    allTime
  }
`;

export async function getPopularAnime(perPage = 24, page = 1) {
  const query = `
    query ($perPage: Int, $page: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, sort: POPULARITY_DESC) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { perPage, page });
  return {
    media: (data.Page.media || []).map(mapAniListAnimeToJikan),
    pageInfo: data.Page.pageInfo
  };
}

export async function getTrendingAnime(perPage = 24, page = 1) {
  const query = `
    query ($perPage: Int, $page: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, sort: TRENDING_DESC, status: RELEASING) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { perPage, page });
  return {
    media: (data.Page.media || []).map(mapAniListAnimeToJikan),
    pageInfo: data.Page.pageInfo
  };
}

export async function getUpcomingAnime(perPage = 24, page = 1) {
  const query = `
    query ($perPage: Int, $page: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, sort: POPULARITY_DESC, status: NOT_YET_RELEASED) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { perPage, page });
  return {
    media: (data.Page.media || []).map(mapAniListAnimeToJikan),
    pageInfo: data.Page.pageInfo
  };
}

export async function getAiringAnime(perPage = 24, page = 1) {
  const query = `
    query ($perPage: Int, $page: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, sort: POPULARITY_DESC, status: RELEASING) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { perPage, page });
  return {
    media: (data.Page.media || []).map(mapAniListAnimeToJikan),
    pageInfo: data.Page.pageInfo
  };
}

export async function searchAnime(search, perPage = 25) {
  if (!search || !search.trim()) return [];
  const cleanSearch = search.trim();
  const query = `
    query ($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await queryAniList(query, { search: cleanSearch, perPage });
    return (data.Page.media || []).map(mapAniListAnimeToJikan);
  } catch {
    try {
      const fallbackQuery = `
        query ($search: String, $perPage: Int) {
          Page(page: 1, perPage: $perPage) {
            media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
              ${ANIME_FIELDS}
            }
          }
        }
      `;
      const fallbackData = await queryAniList(fallbackQuery, { search: cleanSearch, perPage });
      return (fallbackData.Page.media || []).map(mapAniListAnimeToJikan);
    } catch {
      return [];
    }
  }
}

export async function getMangaDetailsCombined(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        id
        idMal
        title {
          english
          romaji
          native
          userPreferred
        }
        description
        bannerImage
        coverImage {
          extraLarge
          large
          medium
        }
        averageScore
        popularity
        favourites
        updatedAt
        siteUrl
        format
        chapters
        volumes
        status
        genres
        seasonYear
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        source
        countryOfOrigin
        rankings {
          rank
          type
          allTime
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                english
                romaji
              }
              type
              format
              countryOfOrigin
              coverImage {
                extraLarge
                large
                medium
              }
            }
          }
        }
        characters(sort: [ROLE, FAVOURITES_DESC], page: 1, perPage: 25) {
          edges {
            role
            node {
              id
              name {
                full
                native
              }
              image {
                large
              }
            }
          }
        }
        staff(page: 1, perPage: 25) {
          edges {
            role
            node {
              id
              name {
                full
                native
              }
              image {
                large
              }
            }
          }
        }
        externalLinks {
          id
          site
          url
          type
          color
          icon
          language
          notes
          isDisabled
        }
      }
    }
  `;
  try {
    const data = await queryAniList(query, { id: parseInt(id) });
    const m = data.Media;
    if (!m) return null;

    const mainAuthor = m.staff?.edges?.find(e => 
      e.role.toLowerCase().includes('story') || 
      e.role.toLowerCase().includes('original') ||
      e.role.toLowerCase().includes('art')
    )?.node?.name?.full || "the original creator";

    const title = m.title?.english || m.title?.romaji || m.title?.userPreferred || "Manga";
    const chapterGuide = await getMediaGuidePage({
      mediaType: "MANGA",
      malId: m.idMal,
      title,
      fallbackCount: m.chapters,
      page: 1,
      perPage: 50,
    });

    return {
      mal_id: m.id,
      malId: m.idMal,
      kitsuId: chapterGuide.kitsuId,
      title,
      title_english: m.title?.english,
      title_japanese: m.title?.native,
      synopsis: stripHtml(m.description || ""),
      background: `${mainAuthor} is credited on this manga, which began publishing in ${m.startDate?.year || "Japan"}. This is the original story used for its related anime adaptations.`,
      images: {
        jpg: {
          image_url: m.coverImage?.large,
          large_image_url: m.coverImage?.extraLarge || m.coverImage?.large
        }
      },
      bannerImage: m.bannerImage,
      score: m.averageScore ? (m.averageScore / 10).toFixed(1) : "N/A",
      popularity: m.popularity || 0,
      favourites: m.favourites || 0,
      updatedAt: m.updatedAt,
      siteUrl: m.siteUrl,
      chapters: chapterGuide.totalCount || positiveNumber(m.chapters) || null,
      chapterGuide: chapterGuide.items,
      volumes: m.volumes || "Unknown",
      status: mapStatus(m.status),
      genres: m.genres || [],
      countryOfOrigin: m.countryOfOrigin || "JP",
      format: mapMangaFormat(m.format, m.countryOfOrigin),
      source: m.source || "ORIGINAL",
      startDate: m.startDate,
      endDate: m.endDate,
      characters: m.characters?.edges || [],
      staff: m.staff?.edges || [],
      relations: (m.relations?.edges || []).map((edge) => ({
        ...edge,
        node: edge.node ? {
          ...edge.node,
          format: mapMediaFormat(edge.node.format, edge.node.countryOfOrigin, edge.node.type),
        } : edge.node,
      })),
      externalLinks: m.externalLinks || []
    };
  } catch (error) {
    console.error("Error fetching manga details:", error);
    return null;
  }
}


export async function getAnimeDetailsCombined(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title {
          english
          romaji
          native
          userPreferred
        }
        description
        bannerImage
        coverImage {
          extraLarge
          large
          medium
        }
        averageScore
        popularity
        format
        episodes
        status
        duration
        genres
        seasonYear
        startDate {
          year
          month
          day
        }
        source
        isAdult
        trailer {
          id
          site
        }
        externalLinks {
          id
          site
          url
          type
          color
          icon
          language
          notes
          isDisabled
        }
        nextAiringEpisode {
          episode
          timeUntilAiring
        }
        studios {
          edges {
            isMain
            node {
              id
              name
            }
          }
          nodes {
            id
            name
          }
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
        rankings {
          rank
          type
          allTime
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                english
                romaji
              }
              type
              format
              countryOfOrigin
              coverImage {
                extraLarge
                large
                medium
              }
            }
          }
        }
        characters(sort: [ROLE, FAVOURITES_DESC], page: 1, perPage: 25) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE) {
              id
              name {
                full
              }
              image {
                large
              }
              language
            }
          }
        }
        staff(page: 1, perPage: 25) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
      }
    }
  `;

  const data = await queryAniList(query, { id: parseInt(id) });
  const media = data.Media;

  if (!media) {
    throw new Error("No media found for the given ID");
  }

  const mappedAnime = {
    ...mapAniListAnimeToJikan(media),
    externalLinks: media.externalLinks || []
  };

  const guide = await getMediaGuidePage({
    mediaType: "ANIME",
    malId: media.idMal,
    title: mappedAnime.title,
    fallbackCount: mappedAnime.episodes,
    page: 1,
    perPage: 50,
  });
  mappedAnime.episodes = Math.max(positiveNumber(mappedAnime.episodes), guide.totalCount) || null;
  mappedAnime.kitsuId = guide.kitsuId;
  if (!mappedAnime.trailer && guide.trailerId) {
    mappedAnime.trailer = {
      youtube_id: guide.trailerId,
      url: `https://www.youtube.com/watch?v=${guide.trailerId}`,
      embed_url: `https://www.youtube.com/embed/${guide.trailerId}`,
    };
  }

  const episodeList = mapAniListEpisodesToJikan(media.streamingEpisodes, mappedAnime.episodes);
  guide.items.forEach((item) => {
    const index = item.number - 1;
    if (index < 0 || index >= episodeList.length) return;
    episodeList[index] = {
      ...episodeList[index],
      ...item,
      mal_id: item.number,
      title: item.title || episodeList[index].title,
      summary: item.summary || episodeList[index].summary,
      thumbnail: item.thumbnail || episodeList[index].thumbnail,
    };
  });

  return {
    anime: mappedAnime,
    characters: mapAniListCharactersToJikan(media.characters?.edges),
    staff: mapAniListStaffToJikan(media.staff?.edges),
    relations: mapAniListRelationsToJikan(media.relations?.edges),
    episodes: episodeList
  };
}

export async function getAnimeCharacters(id, page = 1, perPage = 25) {
  const query = `
    query ($id: Int, $page: Int, $perPage: Int) {
      Media(id: $id, type: ANIME) {
        characters(sort: [ROLE, FAVOURITES_DESC], page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
            currentPage
          }
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE) {
              id
              name {
                full
              }
              image {
                large
              }
              language
            }
          }
        }
      }
    }
  `;
  const data = await queryAniList(query, { id: parseInt(id), page, perPage });
  return {
    characters: mapAniListCharactersToJikan(data.Media?.characters?.edges),
    pageInfo: data.Media?.characters?.pageInfo
  };
}

export async function getAnimeStaff(id, page = 1, perPage = 25) {
  const query = `
    query ($id: Int, $page: Int, $perPage: Int) {
      Media(id: $id, type: ANIME) {
        staff(page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
            currentPage
          }
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
      }
    }
  `;
  const data = await queryAniList(query, { id: parseInt(id), page, perPage });
  return {
    staff: mapAniListStaffToJikan(data.Media?.staff?.edges),
    pageInfo: data.Media?.staff?.pageInfo
  };
}

export async function getTopAiringAnime(perPage = 5) {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { perPage });
  return (data.Page.media || []).map(mapAniListAnimeToJikan);
}

export async function getCharacterDetails(id) {
  const query = `
    query ($id: Int) {
      Character(id: $id) {
        id
        name {
          full
          native
        }
        image {
          large
        }
        media(type: ANIME, sort: POPULARITY_DESC, perPage: 10) {
          nodes {
            coverImage {
              extraLarge
              large
            }
          }
        }
      }
    }
  `;
  const data = await queryAniList(query, { id: parseInt(id) });
  return data.Character;
}

export async function getCharacterPictures(id) {
  const char = await getCharacterDetails(id);
  const pictures = [];
  if (char && char.image?.large) {
    pictures.push({
      jpg: {
        image_url: char.image.large
      }
    });
  }
  if (char && char.media?.nodes) {
    char.media.nodes.forEach(m => {
      if (m.coverImage?.extraLarge || m.coverImage?.large) {
        pictures.push({
          jpg: {
            image_url: m.coverImage.extraLarge || m.coverImage.large
          }
        });
      }
    });
  }
  return pictures;
}

export async function getAnimeListByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids, type: ANIME) {
          id
          title {
            english
            romaji
            userPreferred
          }
          coverImage {
            large
            medium
            extraLarge
          }
          averageScore
          episodes
          format
          genres
        }
      }
    }
  `;
  try {
    const data = await queryAniList(query, { ids });
    return (data.Page.media || []).map(mapAniListAnimeToJikan);
  } catch (error) {
    console.error("Error fetching anime by IDs:", error);
    return [];
  }
}

export async function getSeasonalAnime(season, seasonYear, perPage = 10) {
  const query = `
    query SeasonalAnime($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { season, seasonYear, perPage });
  return (data.Page?.media || []).map(mapAniListAnimeToJikan);
}

export async function getFranchiseGroups(ids) {
  const cleanIds = [...new Set((ids || []).map(Number).filter(Boolean))].slice(0, 25);
  if (!cleanIds.length) return [];
  const query = `
    query FranchiseRelations($ids: [Int]) {
      Page(page: 1, perPage: 25) {
        media(id_in: $ids, type: ANIME) {
          id
          title { english romaji userPreferred }
          coverImage { extraLarge large medium }
          averageScore
          popularity
          format
          episodes
          relations {
            edges {
              relationType(version: 2)
              node {
                id
                type
                title { english romaji userPreferred }
                coverImage { extraLarge large medium }
                averageScore
                popularity
                format
                episodes
              }
            }
          }
        }
      }
    }
  `;
  const data = await queryAniList(query, { ids: cleanIds });
  const allowedRelations = new Set(["PREQUEL", "SEQUEL", "PARENT", "SIDE_STORY", "ALTERNATIVE"]);
  const nodes = new Map();
  const links = [];
  (data.Page?.media || []).forEach((media) => {
    nodes.set(media.id, media);
    (media.relations?.edges || []).forEach((edge) => {
      if (edge.node?.type === "ANIME" && allowedRelations.has(edge.relationType)) {
        nodes.set(edge.node.id, edge.node);
        links.push([media.id, edge.node.id]);
      }
    });
  });
  const parent = new Map([...nodes.keys()].map((id) => [id, id]));
  const find = (id) => parent.get(id) === id ? id : (parent.set(id, find(parent.get(id))), parent.get(id));
  links.forEach(([left, right]) => parent.set(find(right), find(left)));
  const groups = new Map();
  nodes.forEach((node, id) => {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(node);
  });
  return [...groups.values()].map((members) => {
    const unique = [...new Map(members.map((member) => [member.id, member])).values()];
    const totalPopularity = unique.reduce((sum, member) => sum + Number(member.popularity || 0), 0);
    const weightedScore = totalPopularity
      ? unique.reduce((sum, member) => sum + Number(member.averageScore || 0) * Number(member.popularity || 0), 0) / totalPopularity
      : unique.reduce((sum, member) => sum + Number(member.averageScore || 0), 0) / Math.max(1, unique.length);
    const lead = [...unique].sort((a, b) => Number(b.popularity || 0) - Number(a.popularity || 0))[0];
    return {
      mal_id: lead.id,
      title: lead.title?.english || lead.title?.romaji || lead.title?.userPreferred,
      images: { jpg: { large_image_url: lead.coverImage?.extraLarge || lead.coverImage?.large || lead.coverImage?.medium } },
      score: weightedScore ? (weightedScore / 10).toFixed(1) : null,
      popularity: totalPopularity,
      franchiseEntries: unique.length,
      memberIds: unique.map((member) => member.id),
    };
  }).sort((a, b) => b.popularity - a.popularity);
}

export async function getFranchiseDetails(id) {
  const rootId = Number(id);
  if (!rootId) return null;
  const allowedRelations = new Set(["PREQUEL", "SEQUEL", "PARENT", "SIDE_STORY", "ALTERNATIVE", "SOURCE", "ADAPTATION", "SPIN_OFF"]);
  const nodes = new Map();
  const edges = [];
  let frontier = [rootId];

  const query = `
    query FranchiseWalkthrough($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids) {
          id
          type
          title { english romaji native userPreferred }
          description
          bannerImage
          coverImage { extraLarge large medium }
          averageScore
          popularity
          format
          countryOfOrigin
          status
          episodes
          duration
          chapters
          volumes
          genres
          startDate { year month day }
          endDate { year month day }
          relations {
            edges {
              relationType(version: 2)
              node { id type }
            }
          }
        }
      }
    }
  `;

  for (let depth = 0; depth < 3 && frontier.length; depth += 1) {
    const data = await queryAniList(query, { ids: frontier.slice(0, 50) });
    const next = [];
    (data.Page?.media || []).forEach((media) => {
      nodes.set(media.id, media);
      (media.relations?.edges || []).forEach((edge) => {
        if (!edge.node?.id || !allowedRelations.has(edge.relationType)) return;
        edges.push({ from: media.id, to: edge.node.id, relationType: edge.relationType });
        if (!nodes.has(edge.node.id) && !next.includes(edge.node.id) && nodes.size + next.length < 50) next.push(edge.node.id);
      });
    });
    frontier = next;
  }

  if (!nodes.size) return null;
  const dateNumber = (date) => date?.year ? Number(`${date.year}${String(date.month || 1).padStart(2, "0")}${String(date.day || 1).padStart(2, "0")}`) : Number.MAX_SAFE_INTEGER;
  const entries = [...nodes.values()].map((media) => ({
    mal_id: media.id,
    mediaType: media.type,
    title: media.title?.english || media.title?.romaji || media.title?.userPreferred || "Untitled",
    title_japanese: media.title?.native || "",
    synopsis: stripHtml(media.description || ""),
    banner_image: media.bannerImage || "",
    image: media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || "",
    score: media.averageScore ? (media.averageScore / 10).toFixed(1) : null,
    popularity: Number(media.popularity || 0),
    countryOfOrigin: media.countryOfOrigin,
    format: mapMediaFormat(media.format, media.countryOfOrigin, media.type) || media.type,
    status: mapStatus(media.status),
    episodes: media.episodes || null,
    duration: media.duration || null,
    chapters: media.chapters || null,
    volumes: media.volumes || null,
    genres: media.genres || [],
    startDate: media.startDate,
    endDate: media.endDate,
  })).sort((a, b) => dateNumber(a.startDate) - dateNumber(b.startDate));

  const totalPopularity = entries.reduce((sum, entry) => sum + entry.popularity, 0);
  const weightedScore = totalPopularity
    ? entries.reduce((sum, entry) => sum + Number(entry.score || 0) * entry.popularity, 0) / totalPopularity
    : 0;
  const animeEntries = entries.filter((entry) => entry.mediaType === "ANIME");
  const mangaEntries = entries.filter((entry) => entry.mediaType === "MANGA");
  const root = entries.find((entry) => entry.mal_id === rootId) || entries[0];

  return {
    root,
    title: root.title,
    banner: root.banner_image || entries.find((entry) => entry.banner_image)?.banner_image || root.image,
    entries,
    edges,
    combinedScore: weightedScore ? weightedScore.toFixed(1) : null,
    totalPopularity,
    totalEpisodes: animeEntries.reduce((sum, entry) => sum + Number(entry.episodes || (entry.format === "MOVIE" ? 1 : 0)), 0),
    totalChapters: mangaEntries.reduce((sum, entry) => sum + Number(entry.chapters || 0), 0),
    watchMinutes: animeEntries.reduce((sum, entry) => sum + (entry.format === "MOVIE" ? 120 : Number(entry.episodes || 0) * Number(entry.duration || 24)), 0),
    firstRelease: entries[0]?.startDate || null,
    latestRelease: entries[entries.length - 1]?.endDate || entries[entries.length - 1]?.startDate || null,
  };
}

export async function getPopularManga(page = 1, perPage = 24, sort = "POPULARITY_DESC") {
  const query = `
    query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(type: MANGA, sort: $sort) {
          id
          title {
            english
            romaji
            userPreferred
          }
          coverImage {
            extraLarge
            large
            medium
          }
          averageScore
          popularity
          format
          countryOfOrigin
          chapters
          volumes
          status
          genres
          seasonYear
          startDate {
            year
          }
        }
      }
    }
  `;
  try {
    const data = await queryAniList(query, { page, perPage, sort: [sort] });
    return {
      media: (data.Page.media || []).map((m) => ({
        mal_id: m.id,
        title: m.title?.english || m.title?.romaji || m.title?.userPreferred || "Manga",
        title_english: m.title?.english,
        images: {
          jpg: {
            image_url: m.coverImage?.large,
            large_image_url: m.coverImage?.extraLarge || m.coverImage?.large
          }
        },
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : "N/A",
        chapters: m.chapters,
        volumes: m.volumes,
        status: mapStatus(m.status),
        genres: m.genres || [],
        year: m.startDate?.year || m.seasonYear,
        countryOfOrigin: m.countryOfOrigin,
        format: mapMangaFormat(m.format, m.countryOfOrigin),
        type: mapMangaFormat(m.format, m.countryOfOrigin)
      })),
      pageInfo: data.Page.pageInfo
    };
  } catch (error) {
    console.error("Error fetching popular manga:", error);
    return { media: [], pageInfo: { hasNextPage: false } };
  }
}

export async function searchManga(search, perPage = 12) {
  const query = `
    query ($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: MANGA, search: $search, sort: SEARCH_MATCH, isAdult: false) {
          id
          title { english romaji userPreferred }
          coverImage { extraLarge large medium }
          averageScore
          format
          countryOfOrigin
          chapters
          volumes
          status
          genres
          startDate { year }
        }
      }
    }
  `;
  const data = await queryAniList(query, { search, perPage });
  return (data.Page.media || []).map((m) => ({
    mal_id: m.id,
    title: m.title?.english || m.title?.romaji || m.title?.userPreferred || "Manga",
    title_english: m.title?.english,
    images: { jpg: { image_url: m.coverImage?.large, large_image_url: m.coverImage?.extraLarge || m.coverImage?.large } },
    score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
    chapters: m.chapters,
    volumes: m.volumes,
    status: mapStatus(m.status),
    genres: m.genres || [],
    year: m.startDate?.year,
    countryOfOrigin: m.countryOfOrigin,
    format: mapMangaFormat(m.format, m.countryOfOrigin),
    type: mapMangaFormat(m.format, m.countryOfOrigin),
  }));
}

export async function getAnimeByGenre(genre, perPage = 24, page = 1, sort = "FAVOURITES_DESC") {
  const query = `
    query ($genre: String, $perPage: Int, $page: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, genre: $genre, sort: $sort, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  try {
    let sortArray;
    if (sort === "FAVOURITES_DESC") {
      sortArray = ["FAVOURITES_DESC", "SCORE_DESC"];
    } else if (sort === "SCORE_DESC") {
      sortArray = ["SCORE_DESC", "FAVOURITES_DESC"];
    } else if (sort === "POPULARITY_DESC") {
      sortArray = ["POPULARITY_DESC", "FAVOURITES_DESC"];
    } else if (sort === "START_DATE_DESC") {
      sortArray = ["START_DATE_DESC", "POPULARITY_DESC"];
    } else {
      sortArray = [sort, "FAVOURITES_DESC"];
    }

    const data = await queryAniList(query, { genre, perPage, page, sort: sortArray });
    return {
      media: (data.Page.media || []).map(mapAniListAnimeToJikan),
      pageInfo: data.Page.pageInfo
    };
  } catch (error) {
    console.error("Error fetching anime by genre:", error);
    return { media: [], pageInfo: { hasNextPage: false } };
  }
}

export async function getMangaByGenre(genre, perPage = 24, page = 1, sort = "FAVOURITES_DESC") {
  const query = `
    query ($genre: String, $perPage: Int, $page: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(type: MANGA, genre: $genre, sort: $sort, isAdult: false) {
          id
          title { english romaji userPreferred }
          coverImage { extraLarge large medium }
          averageScore
          popularity
          favourites
          format
          countryOfOrigin
          chapters
          volumes
          status
          genres
          startDate { year }
          bannerImage
        }
      }
    }
  `;
  const sortArray = sort === "SCORE_DESC"
    ? ["SCORE_DESC", "FAVOURITES_DESC"]
    : sort === "POPULARITY_DESC"
      ? ["POPULARITY_DESC", "FAVOURITES_DESC"]
      : sort === "START_DATE_DESC"
        ? ["START_DATE_DESC", "POPULARITY_DESC"]
        : ["FAVOURITES_DESC", "SCORE_DESC"];
  try {
    const data = await queryAniList(query, { genre, perPage, page, sort: sortArray });
    return {
      media: (data.Page.media || []).map((manga) => ({
        mal_id: manga.id,
        title: manga.title?.english || manga.title?.romaji || manga.title?.userPreferred || "Manga",
        title_english: manga.title?.english,
        images: { jpg: { image_url: manga.coverImage?.large, large_image_url: manga.coverImage?.extraLarge || manga.coverImage?.large } },
        banner_image: manga.bannerImage,
        score: manga.averageScore ? (manga.averageScore / 10).toFixed(1) : null,
        popularity: manga.popularity || 0,
        favourites: manga.favourites || 0,
        chapters: manga.chapters,
        volumes: manga.volumes,
        status: mapStatus(manga.status),
        genres: manga.genres || [],
        year: manga.startDate?.year,
        countryOfOrigin: manga.countryOfOrigin,
        format: mapMangaFormat(manga.format, manga.countryOfOrigin),
        type: mapMangaFormat(manga.format, manga.countryOfOrigin),
      })),
      pageInfo: data.Page.pageInfo,
    };
  } catch (error) {
    console.error("Error fetching manga by genre:", error);
    return { media: [], pageInfo: { hasNextPage: false } };
  }
}

export async function getGenreArtworks() {
  const query = `
    query {
      Action: Page(page: 1, perPage: 1) { media(genre: "Action", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Adventure: Page(page: 1, perPage: 1) { media(genre: "Adventure", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Fantasy: Page(page: 1, perPage: 1) { media(genre: "Fantasy", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Romance: Page(page: 1, perPage: 1) { media(genre: "Romance", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      SciFi: Page(page: 1, perPage: 1) { media(genre: "Sci-Fi", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Supernatural: Page(page: 1, perPage: 1) { media(genre: "Supernatural", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Drama: Page(page: 1, perPage: 1) { media(genre: "Drama", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Comedy: Page(page: 1, perPage: 1) { media(genre: "Comedy", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Mystery: Page(page: 1, perPage: 1) { media(genre: "Mystery", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Sports: Page(page: 1, perPage: 1) { media(genre: "Sports", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Horror: Page(page: 1, perPage: 1) { media(genre: "Horror", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      SliceOfLife: Page(page: 1, perPage: 1) { media(genre: "Slice of Life", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Psychological: Page(page: 1, perPage: 1) { media(genre: "Psychological", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Music: Page(page: 1, perPage: 1) { media(genre: "Music", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Thriller: Page(page: 1, perPage: 1) { media(genre: "Thriller", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      Mecha: Page(page: 1, perPage: 1) { media(genre: "Mecha", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
      MahouShoujo: Page(page: 1, perPage: 1) { media(genre: "Mahou Shoujo", sort: FAVOURITES_DESC, type: ANIME, isAdult: false) { coverImage { extraLarge large } title { english romaji userPreferred } } }
    }
  `;
  try {
    const data = await queryAniList(query);
    const map = {};
    const keyToGenre = {
      Action: "Action",
      Adventure: "Adventure",
      Fantasy: "Fantasy",
      Romance: "Romance",
      SciFi: "Sci-Fi",
      Supernatural: "Supernatural",
      Drama: "Drama",
      Comedy: "Comedy",
      Mystery: "Mystery",
      Sports: "Sports",
      Horror: "Horror",
      SliceOfLife: "Slice of Life",
      Psychological: "Psychological",
      Music: "Music",
      Thriller: "Thriller",
      Mecha: "Mecha",
      MahouShoujo: "Mahou Shoujo",
    };
    Object.keys(keyToGenre).forEach((key) => {
      const genre = keyToGenre[key];
      const media = data[key]?.media?.[0];
      if (media) {
        map[genre] = {
          image: media.coverImage?.extraLarge || media.coverImage?.large,
          title: media.title?.english || media.title?.romaji || media.title?.userPreferred
        };
      }
    });
    return map;
  } catch (err) {
    console.error("Error fetching genre artworks:", err);
    return {};
  }
}
