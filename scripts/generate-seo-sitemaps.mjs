import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://animeorbit.web.app";
const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(scriptDirectory, "../public");
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

const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemap-pages.xml</loc><lastmod>${generatedOn}</lastmod></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-content.xml</loc><lastmod>${generatedOn}</lastmod></sitemap>
</sitemapindex>
`;

const query = `
  query SitemapContent($page: Int!, $perPage: Int!) {
    anime: Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { id updatedAt }
    }
    manga: Page(page: $page, perPage: $perPage) {
      media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) { id updatedAt }
    }
    characters: Page(page: $page, perPage: $perPage) {
      characters(sort: FAVOURITES_DESC) { id }
    }
    staff: Page(page: $page, perPage: $perPage) {
      staff(sort: FAVOURITES_DESC) { id primaryOccupations languageV2 }
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

await writeFile(path.join(publicDirectory, "sitemap-pages.xml"), staticSitemap, "utf8");
await writeFile(path.join(publicDirectory, "sitemap.xml"), sitemapIndex, "utf8");

try {
  const pages = [];
  for (let page = 1; page <= 5; page += 1) {
    pages.push(await fetchPage(page));
    if (page < 5) await new Promise((resolve) => setTimeout(resolve, 350));
  }

  const entries = new Map();
  const add = (url, lastModified) => entries.set(url, lastModified || entries.get(url));

  pages.forEach((data) => {
    (data.anime?.media || []).forEach((item) => {
      add(`${SITE_URL}/anime/${item.id}`, asDate(item.updatedAt));
      add(`${SITE_URL}/franchise/${item.id}`, asDate(item.updatedAt));
    });
    (data.manga?.media || []).forEach((item) =>
      add(`${SITE_URL}/manga/${item.id}`, asDate(item.updatedAt)),
    );
    (data.characters?.characters || []).forEach((item) =>
      add(`${SITE_URL}/character/${item.id}`),
    );
    (data.staff?.staff || [])
      .filter((item) => {
        const occupations = (item.primaryOccupations || []).join(" ").toLowerCase();
        return /voice|seiyuu|actor/.test(occupations) || item.languageV2 === "Japanese";
      })
      .forEach((item) => add(`${SITE_URL}/voice-actor/${item.id}`));
  });

  const contentSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...entries.entries()].map(([url, lastModified]) => urlEntry(url, lastModified)).join("\n")}
</urlset>
`;
  await writeFile(path.join(publicDirectory, "sitemap-content.xml"), contentSitemap, "utf8");
  console.log(`Generated page sitemap and ${entries.size} public content URLs.`);
} catch (error) {
  try {
    await access(path.join(publicDirectory, "sitemap-content.xml"));
    console.warn(`Sitemap API refresh skipped; preserving the last generated content sitemap. ${error.message}`);
  } catch {
    await writeFile(
      path.join(publicDirectory, "sitemap-content.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n`,
      "utf8",
    );
    console.warn(`Sitemap API refresh failed; wrote a valid empty content sitemap. ${error.message}`);
  }
}
