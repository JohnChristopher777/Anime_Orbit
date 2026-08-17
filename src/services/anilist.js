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

  return {
    mal_id: media.id,
    title: displayTitle,
    title_english: media.title.english || displayTitle,
    title_japanese: media.title.native || "",
    synopsis: stripHtml(media.description),
    images: {
      jpg: {
        large_image_url: media.coverImage?.extraLarge || media.coverImage?.large || "",
        image_url: media.coverImage?.large || media.coverImage?.medium || "",
        small_image_url: media.coverImage?.medium || "",
      }
    },
    score: media.averageScore ? (media.averageScore / 10).toFixed(1) : null,
    scored_by: media.popularity || 0,
    rank: rankObj ? rankObj.rank : null,
    popularity: popularityObj ? popularityObj.rank : null,
    type: mapFormat(media.format),
    episodes: media.episodes || 0,
    status: mapStatus(media.status),
    duration: media.duration ? `${media.duration} min` : null,
    genres: media.genres?.map((g, index) => ({ mal_id: index, name: g })) || [],
    studios: media.studios?.nodes?.map(s => ({ mal_id: s.id, name: s.name })) || [],
    producers: [], // AniList doesn't distinguish producers as easily
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

// Relations mapping
function mapAniListRelationsToJikan(edges) {
  if (!edges) return [];
  const groups = {};
  edges.forEach(edge => {
    const relType = edge.relationType.replace(/_/g, " ").toLowerCase();
    const relationName = relType.replace(/\b\w/g, c => c.toUpperCase());
    
    if (!groups[relationName]) {
      groups[relationName] = [];
    }
    groups[relationName].push({
      mal_id: edge.node.id,
      name: edge.node.title.english || edge.node.title.romaji || "Unknown Title",
      type: mapFormat(edge.node.format) || edge.node.type || "N/A"
    });
  });
  
  return Object.keys(groups).map(rel => ({
    relation: rel,
    entry: groups[rel]
  }));
}

// Episodes mapping
function mapAniListEpisodesToJikan(streamingEpisodes, totalEpisodes) {
  if (streamingEpisodes && streamingEpisodes.length > 0) {
    return streamingEpisodes.map((ep, index) => {
      const match = ep.title.match(/(?:Episode|Ep)\s*(\d+)/i);
      const epId = match ? parseInt(match[1]) : index + 1;
      return {
        mal_id: epId,
        title: ep.title,
        aired: null
      };
    });
  }
  
  const count = totalEpisodes || 0;
  const generated = [];
  for (let i = 1; i <= count; i++) {
    generated.push({
      mal_id: i,
      title: `Episode ${i}`,
      aired: null
    });
  }
  return generated;
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

export async function getAiringAnime(perPage = 25) {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, status: RELEASING) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { perPage });
  return (data.Page.media || []).map(mapAniListAnimeToJikan);
}

export async function searchAnime(search, perPage = 25) {
  const query = `
    query ($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { search, perPage });
  return (data.Page.media || []).map(mapAniListAnimeToJikan);
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
        studios {
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

  return {
    anime: {
      ...mapAniListAnimeToJikan(media),
      externalLinks: media.externalLinks || []
    },
    characters: mapAniListCharactersToJikan(media.characters?.edges),
    staff: mapAniListStaffToJikan(media.staff?.edges),
    relations: mapAniListRelationsToJikan(media.relations?.edges),
    episodes: mapAniListEpisodesToJikan(media.streamingEpisodes, media.episodes)
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

