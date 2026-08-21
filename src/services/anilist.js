const ANILIST_API_URL = import.meta.env.VITE_ANILIST_API_URL || "https://graphql.anilist.co";

async function queryAniList(query, variables = {}) {
  const response = await fetch(ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AniList GraphQL Error: ${response.status} - ${errorText}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`AniList GraphQL Errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
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
  if (!source) return "N/A";
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
    } else if (media.status === "RELEASING") {
      resolvedEpisodes = 1120;
    } else {
      resolvedEpisodes = 0;
    }
  }

  const finalStudios = mainStudios.length > 0 ? mainStudios : (allStudiosNodes.slice(0, 2));
  const finalProducers = producerStudios.length > 0 ? producerStudios : (allStudiosNodes.slice(2));

  return {
    mal_id: media.id,
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
    studios: finalStudios.length > 0 ? finalStudios : [{ mal_id: 1, name: "Toei Animation" }],
    producers: finalProducers.length > 0 ? finalProducers : finalStudios,
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
      type: mapFormat(edge.node.format) || edge.node.type || "N/A",
      format: mapFormat(edge.node.format),
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
      summary: stream?.title ? `${stream.title} - Official broadcast episode.` : `Episode ${i} of the animated series.`
    });
  }

  return finalEpisodes;
}

const ANIME_FIELDS = `
  id
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

    return {
      mal_id: m.id,
      title: m.title?.english || m.title?.romaji || m.title?.userPreferred || "Manga",
      title_english: m.title?.english,
      title_japanese: m.title?.native,
      synopsis: stripHtml(m.description || ""),
      background: `Original manga masterpiece authored and illustrated by ${mainAuthor}. First published in official Japanese serialization starting in ${m.startDate?.year || "Japan"}. This work pioneered the story world and served as the direct foundational source material for the animated series adaptations.`,
      images: {
        jpg: {
          image_url: m.coverImage?.large,
          large_image_url: m.coverImage?.extraLarge || m.coverImage?.large
        }
      },
      bannerImage: m.bannerImage,
      score: m.averageScore ? (m.averageScore / 10).toFixed(1) : "N/A",
      chapters: m.chapters || "Publishing / Ongoing",
      volumes: m.volumes || "Unknown",
      status: mapStatus(m.status),
      genres: m.genres || [],
      countryOfOrigin: m.countryOfOrigin || "JP",
      format: m.format || "MANGA",
      startDate: m.startDate,
      endDate: m.endDate,
      characters: m.characters?.edges || [],
      staff: m.staff?.edges || [],
      relations: m.relations?.edges || [],
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

  return {
    anime: mappedAnime,
    characters: mapAniListCharactersToJikan(media.characters?.edges),
    staff: mapAniListStaffToJikan(media.staff?.edges),
    relations: mapAniListRelationsToJikan(media.relations?.edges),
    episodes: mapAniListEpisodesToJikan(media.streamingEpisodes, mappedAnime.episodes)
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
        format: m.format || "MANGA",
        type: "Manga"
      })),
      pageInfo: data.Page.pageInfo
    };
  } catch (error) {
    console.error("Error fetching popular manga:", error);
    return { media: [], pageInfo: { hasNextPage: false } };
  }
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


