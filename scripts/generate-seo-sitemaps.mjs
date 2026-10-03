import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://animeorbit.web.app";
const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(scriptDirectory, "../public");
const seoRouteCache = path.join(scriptDirectory, "seo-routes.generated.json");
const generatedOn = new Date().toISOString().slice(0, 10);

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const urlEntry = (location, lastModified) =>
  `  <url><loc>${escapeXml(location)}</loc>${lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : ""}</url>`;

const staticRoutes = [
  "/",
  "/popular",
  "/trending",
  "/airing",
  "/upcoming",
  "/manga",
  "/genres",
  "/discovery",
  "/discovery/characters",
  "/digest",
  "/franchises",
];

const staticSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map((route) => urlEntry(`${SITE_URL}${route}`, generatedOn)).join("\n")}
</urlset>
`;

const writePrimarySitemap = async () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemap-pages.xml</loc><lastmod>${generatedOn}</lastmod></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-content.xml</loc><lastmod>${generatedOn}</lastmod></sitemap>
</sitemapindex>
`;
  await writeFile(path.join(publicDirectory, "sitemap.xml"), sitemap, "utf8");
};

const query = `
  query SitemapContent($page: Int!, $perPage: Int!) {
    anime: Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
        id updatedAt format seasonYear episodes duration averageScore genres
        title { english romaji native }
        description(asHtml: false)
        coverImage { extraLarge large }
        studios(isMain: true) { nodes { name } }
      }
    }
    manga: Page(page: $page, perPage: $perPage) {
      media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
        id updatedAt format startDate { year } chapters volumes averageScore genres
        title { english romaji native }
        description(asHtml: false)
        coverImage { extraLarge large }
        staff(perPage: 4, sort: RELEVANCE) { edges { role node { name { full } } } }
      }
    }
    characters: Page(page: $page, perPage: $perPage) {
      characters(sort: FAVOURITES_DESC) {
        id name { full native }
        description(asHtml: false)
        image { large }
        media(perPage: 3, sort: POPULARITY_DESC) { nodes { id title { english romaji } } }
      }
    }
    staff: Page(page: $page, perPage: $perPage) {
      staff(sort: FAVOURITES_DESC) {
        id primaryOccupations languageV2
        name { full native }
        description(asHtml: false)
        image { large }
        staffMedia(perPage: 3, sort: POPULARITY_DESC) { nodes { id title { english romaji } } }
      }
    }
  }
`;

const fetchPage = async (page) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "AnimeOrbit-Sitemap/1.0",
      },
      body: JSON.stringify({ query, variables: { page, perPage: 50 } }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`AniList returned ${response.status}`);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error(payload.errors[0].message || "AniList sitemap query failed");
    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
};

const asDate = (timestamp) =>
  timestamp ? new Date(Number(timestamp) * 1000).toISOString().slice(0, 10) : undefined;

const cleanText = (value = "") =>
  String(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value, limit = 158) => {
  const text = cleanText(value);
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).replace(/\s+\S*$/, "")}…`;
};

const mediaTitle = (item) => item.title?.english || item.title?.romaji || item.title?.native || `AniList title ${item.id}`;
const mediaImage = (item) => item.coverImage?.extraLarge || item.coverImage?.large;
const absolute = (route) => `${SITE_URL}${route}`;
const compact = (value) => JSON.parse(JSON.stringify(value, (_key, entry) => entry == null || entry === "" ? undefined : entry));

const animeRoute = (item) => {
  const name = mediaTitle(item);
  const route = `/anime/${item.id}`;
  const format = String(item.format || "").replaceAll("_", " ").toLowerCase();
  const description = truncate(item.description) || `Explore ${name}: synopsis, episodes, characters, voice cast, reviews, discussions, related titles and watchlist tracking.`;
  return compact({
    path: route,
    title: `${name} Anime Details | Anime Orbit`,
    description,
    image: mediaImage(item),
    heading: name,
    eyebrow: "Anime guide",
    summary: `${item.seasonYear ? `${item.seasonYear} ` : ""}${format || "anime"}${item.episodes ? ` · ${item.episodes} episodes` : ""}${item.averageScore ? ` · ${item.averageScore}% score` : ""}. ${description}`,
    schema: {
      "@type": item.format === "MOVIE" ? "Movie" : "TVSeries",
      "@id": `${absolute(route)}#series`,
      name,
      alternateName: item.title?.native,
      url: absolute(route),
      image: mediaImage(item),
      description,
      genre: item.genres,
      datePublished: item.seasonYear ? String(item.seasonYear) : undefined,
      numberOfEpisodes: item.episodes,
      aggregateRating: item.averageScore ? { "@type": "AggregateRating", ratingValue: item.averageScore / 10, bestRating: 10, worstRating: 0 } : undefined,
      productionCompany: item.studios?.nodes?.map((studio) => ({ "@type": "Organization", name: studio.name })),
    },
  });
};

const franchiseRoute = (item) => {
  const name = mediaTitle(item);
  const route = `/franchise/${item.id}`;
  const description = `Explore the complete ${name} franchise: connected anime entries, release order, chronology and direct series links on Anime Orbit.`;
  return compact({
    path: route,
    title: `${name} Franchise Guide & Watch Order | Anime Orbit`,
    description,
    image: mediaImage(item),
    heading: `${name} franchise`,
    eyebrow: "Franchise guide",
    summary: description,
    schema: { "@type": "CreativeWorkSeries", "@id": `${absolute(route)}#franchise`, name: `${name} franchise`, url: absolute(route), image: mediaImage(item), description },
  });
};

const mangaRoute = (item) => {
  const name = mediaTitle(item);
  const route = `/manga/${item.id}`;
  const description = truncate(item.description) || `Explore ${name}: synopsis, chapters, volumes, creators, reviews, discussions and manga-list tracking.`;
  const creators = (item.staff?.edges || []).map((edge) => edge.node?.name?.full).filter(Boolean);
  return compact({
    path: route,
    title: `${name} Manga Details | Anime Orbit`,
    description,
    image: mediaImage(item),
    heading: name,
    eyebrow: "Manga guide",
    summary: `${item.startDate?.year ? `${item.startDate.year} · ` : ""}${item.chapters ? `${item.chapters} chapters · ` : ""}${item.volumes ? `${item.volumes} volumes. ` : ""}${description}`,
    schema: {
      "@type": "BookSeries",
      "@id": `${absolute(route)}#series`,
      name,
      alternateName: item.title?.native,
      url: absolute(route),
      image: mediaImage(item),
      description,
      genre: item.genres,
      datePublished: item.startDate?.year ? String(item.startDate.year) : undefined,
      numberOfItems: item.volumes || item.chapters,
      author: creators.map((creator) => ({ "@type": "Person", name: creator })),
    },
  });
};

const characterRoute = (item) => {
  const name = item.name?.full || `Anime character ${item.id}`;
  const route = `/character/${item.id}`;
  const titles = (item.media?.nodes || []).map(mediaTitle).filter(Boolean);
  const description = truncate(item.description) || `View ${name}'s anime and manga appearances, artwork, profile information and Japanese and English voice cast.`;
  return compact({
    path: route,
    title: `${name} – Anime Character & Voice Cast | Anime Orbit`,
    description,
    image: item.image?.large,
    heading: name,
    eyebrow: "Character profile",
    summary: `${titles.length ? `Appears in ${titles.join(", ")}. ` : ""}${description}`,
    schema: { "@type": "Person", "@id": `${absolute(route)}#character`, name, alternateName: item.name?.native, url: absolute(route), image: item.image?.large, description },
  });
};

const staffRoute = (item) => {
  const name = item.name?.full || `Voice actor ${item.id}`;
  const route = `/voice-actor/${item.id}`;
  const titles = (item.staffMedia?.nodes || []).map(mediaTitle).filter(Boolean);
  const description = truncate(item.description) || `Explore ${name}'s voice acting profile, Japanese and English roles, characters and complete anime role history.`;
  return compact({
    path: route,
    title: `${name} – Voice Actor Roles & Characters | Anime Orbit`,
    description,
    image: item.image?.large,
    heading: name,
    eyebrow: "Voice actor profile",
    summary: `${titles.length ? `Known for ${titles.join(", ")}. ` : ""}${description}`,
    schema: { "@type": "Person", "@id": `${absolute(route)}#person`, name, alternateName: item.name?.native, url: absolute(route), image: item.image?.large, description, knowsLanguage: item.languageV2 },
  });
};

await writeFile(path.join(publicDirectory, "sitemap-pages.xml"), staticSitemap, "utf8");

try {
  const pages = [];
  for (let page = 1; page <= 5; page += 1) {
    pages.push(await fetchPage(page));
    if (page < 5) await new Promise((resolve) => setTimeout(resolve, 350));
  }

  const entries = new Map();
  const routeMetadata = [];
  const add = (url, lastModified) => entries.set(url, lastModified || entries.get(url));

  pages.forEach((data) => {
    (data.anime?.media || []).forEach((item) => {
      add(`${SITE_URL}/anime/${item.id}`, asDate(item.updatedAt));
      add(`${SITE_URL}/franchise/${item.id}`, asDate(item.updatedAt));
      routeMetadata.push(animeRoute(item), franchiseRoute(item));
    });
    (data.manga?.media || []).forEach((item) => {
      add(`${SITE_URL}/manga/${item.id}`, asDate(item.updatedAt));
      routeMetadata.push(mangaRoute(item));
    });
    (data.characters?.characters || []).forEach((item) => {
      add(`${SITE_URL}/character/${item.id}`);
      routeMetadata.push(characterRoute(item));
    });
    (data.staff?.staff || [])
      .filter((item) => {
        const occupations = (item.primaryOccupations || []).join(" ").toLowerCase();
        return /voice|seiyuu|actor/.test(occupations) || item.languageV2 === "Japanese";
      })
      .forEach((item) => {
        add(`${SITE_URL}/voice-actor/${item.id}`);
        routeMetadata.push(staffRoute(item));
      });
  });

  const contentSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...entries.entries()].map(([url, lastModified]) => urlEntry(url, lastModified)).join("\n")}
</urlset>
`;
  await writeFile(path.join(publicDirectory, "sitemap-content.xml"), contentSitemap, "utf8");
  await writePrimarySitemap();
  const uniqueRoutes = [...new Map(routeMetadata.map((entry) => [entry.path, entry])).values()];
  await writeFile(seoRouteCache, `${JSON.stringify(uniqueRoutes, null, 2)}\n`, "utf8");
  console.log(`Generated page sitemap and ${entries.size} public content URLs.`);
} catch (error) {
  try {
    const existingContent = await readFile(path.join(publicDirectory, "sitemap-content.xml"), "utf8");
    const preservedEntries = new Map();
    for (const match of existingContent.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?\s*<\/url>/g)) {
      preservedEntries.set(match[1], match[2] || undefined);
    }
    await writePrimarySitemap();
    console.warn(`Sitemap API refresh skipped; preserving the last generated content sitemap. ${error.message}`);
  } catch {
    await writeFile(
      path.join(publicDirectory, "sitemap-content.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n`,
      "utf8",
    );
    await writePrimarySitemap();
    console.warn(`Sitemap API refresh failed; wrote a valid empty content sitemap. ${error.message}`);
  }
  try {
    await readFile(seoRouteCache, "utf8");
  } catch {
    await writeFile(seoRouteCache, "[]\n", "utf8");
  }
}
