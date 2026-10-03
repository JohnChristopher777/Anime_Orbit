import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://animeorbit.web.app";
const SITE_NAME = "Anime Orbit";
const DEFAULT_IMAGE = `${SITE_URL}/animeorbit.jpg`;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const buildDirectory = path.join(projectDirectory, "build");
const routeCache = path.join(scriptDirectory, "seo-routes.generated.json");

const staticRoutes = [
  {
    path: "/",
    title: "Anime Orbit | Anime & Manga Discovery, Guides & Tracking",
    description: "Discover anime and manga, explore episode and chapter guides, track watchlists, build tier lists, and join community discussions on Anime Orbit.",
    heading: "Anime Orbit",
    eyebrow: "Your anime and manga compass",
    summary: "Discover new anime and manga, follow complete franchises, search scenes and characters, track your progress, and share your favourites with the community.",
    schema: { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, alternateName: ["AnimeOrbit", "Anime Orbit App"], url: `${SITE_URL}/` },
  },
  { path: "/popular", title: "Popular Anime Rankings | Anime Orbit", description: "Browse the most popular anime titles, compare scores and open complete series guides on Anime Orbit.", heading: "Popular anime", eyebrow: "Community favourites", summary: "Explore widely followed anime titles with scores, formats, release details and direct links to full series guides.", schemaType: "CollectionPage" },
  { path: "/trending", title: "Trending Anime Now | Anime Orbit", description: "See which anime titles are trending now and open their episode, cast, review and watchlist details.", heading: "Trending anime", eyebrow: "What fans are watching", summary: "Follow currently rising anime and open each title for episodes, voice cast, reviews, discussions and tracking tools.", schemaType: "CollectionPage" },
  { path: "/airing", title: "Currently Airing Anime Schedule | Anime Orbit", description: "Find currently airing anime, episode progress and ongoing series details on Anime Orbit.", heading: "Currently airing anime", eyebrow: "Ongoing series", summary: "Browse ongoing anime and follow their available episodes, release information, scores and watchlist progress.", schemaType: "CollectionPage" },
  { path: "/upcoming", title: "Upcoming Anime Releases | Anime Orbit", description: "Discover upcoming anime seasons, movies and announced releases with direct series guides.", heading: "Upcoming anime", eyebrow: "What comes next", summary: "Explore announced anime releases, upcoming seasons and movies with dates, formats and related franchise information.", schemaType: "CollectionPage" },
  { path: "/manga", title: "Manga Discovery, Chapters & Lists | Anime Orbit", description: "Discover popular manga, browse chapter and creator details, and maintain your personal manga list.", heading: "Manga discovery", eyebrow: "Read beyond the screen", summary: "Browse manga titles, inspect chapters, volumes and creators, and track reading progress in your personal list.", schemaType: "CollectionPage" },
  { path: "/genres", title: "Browse Anime by Genre | Anime Orbit", description: "Browse anime by action, adventure, comedy, drama, fantasy, romance and more genres.", heading: "Anime genres", eyebrow: "Find your next genre", summary: "Choose a genre and explore matching anime with scores, formats and direct links to complete title guides.", schemaType: "CollectionPage" },
  { path: "/discovery", title: "Anime Discovery – Scene, Quote, Character & Voice Search | Anime Orbit", description: "Identify anime from a scene image, remembered quote, character traits or shared Japanese voice actor, then open the matching title guide.", heading: "Anime discovery", eyebrow: "Find something worth watching", summary: "Search by scene image, dialogue, character appearance and story clues, or reverse voice-cast connections. Results lead directly to the matching anime, character or actor page.", schemaType: "WebApplication" },
  { path: "/discovery/characters", title: "Anime Character Finder by Appearance & Traits | Anime Orbit", description: "Find anime characters by name, hair colour, eye colour, gender, age, appearance and remembered personality traits.", heading: "Anime character finder", eyebrow: "Visual and story filters", summary: "Combine appearance filters with a name or distinctive story details to identify a character and open their artwork, anime appearances and voice cast.", schemaType: "WebApplication" },
  { path: "/digest", title: "Anime Digest – Facts, Quotes & Voice Connections | Anime Orbit", description: "Explore rotating anime facts, quotes, character links and Japanese voice-actor connections.", heading: "Anime digest", eyebrow: "A quick trip through anime", summary: "Discover quotes, character facts and surprising Japanese voice-cast connections, with direct links into Anime Orbit's guides.", schemaType: "CollectionPage" },
  { path: "/franchises", title: "Anime Franchise Guides & Watch Orders | Anime Orbit", description: "Browse connected anime franchises and open release-order and chronology guides for every series.", heading: "Anime franchise guides", eyebrow: "Every connected entry", summary: "Explore anime franchises, their related seasons, movies and specials, then choose between release order and story chronology.", schemaType: "CollectionPage" },
];

const htmlEscape = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const jsonForHtml = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const canonicalFor = (route) => `${SITE_URL}${route === "/" ? "/" : route}`;

const replaceMeta = (html, selector, attribute, value) => {
  const escaped = htmlEscape(value);
  const expression = new RegExp(`<meta\\s+${attribute}=["']${selector}["'][^>]*>`, "i");
  const tag = `<meta ${attribute}="${htmlEscape(selector)}" content="${escaped}" />`;
  return expression.test(html) ? html.replace(expression, tag) : html.replace("</head>", `  ${tag}\n  </head>`);
};

const routeLabel = (route) => route
  .split("/")
  .filter(Boolean)
  .map((part) => part.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()))
  .join(" / ");

const structuredData = (route) => {
  const canonical = canonicalFor(route.path);
  const pageType = route.schemaType === "WebApplication" ? "WebPage" : route.schemaType || "ItemPage";
  const entity = route.schema || {
    "@type": route.schemaType || "CollectionPage",
    "@id": `${canonical}#primary-entity`,
    name: route.heading,
    url: canonical,
    description: route.description,
  };
  const crumbs = [{ "@type": "ListItem", position: 1, name: "Anime Orbit", item: `${SITE_URL}/` }];
  if (route.path !== "/") crumbs.push({ "@type": "ListItem", position: 2, name: route.heading, item: canonical });
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": pageType,
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: route.title,
        description: route.description,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        primaryImageOfPage: { "@id": `${canonical}#primary-image` },
        breadcrumb: { "@id": `${canonical}#breadcrumb` },
        mainEntity: { "@id": entity["@id"] || `${canonical}#primary-entity` },
      },
      {
        "@type": "ImageObject",
        "@id": `${canonical}#primary-image`,
        url: route.image || DEFAULT_IMAGE,
        contentUrl: route.image || DEFAULT_IMAGE,
        caption: route.heading,
      },
      { "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`, itemListElement: crumbs },
      entity,
    ],
  };
};

const fallbackMarkup = (route) => {
  const links = [
    ["/popular", "Popular anime"],
    ["/manga", "Manga"],
    ["/discovery", "Anime discovery"],
    ["/franchises", "Franchise guides"],
  ];
  const image = route.image
    ? `<img src="${htmlEscape(route.image)}" alt="${htmlEscape(route.heading)}" width="180" height="250" style="width:clamp(120px,24vw,180px);height:auto;max-height:250px;object-fit:cover;border-radius:12px" />`
    : "";
  return `<main data-seo-fallback="true" style="min-height:55vh;background:#09090d;color:#f7f7fb;padding:clamp(32px,8vw,88px) clamp(20px,7vw,96px);font-family:Inter,Arial,sans-serif"><div style="max-width:920px;margin:0 auto;display:flex;align-items:flex-start;gap:clamp(20px,4vw,40px);flex-wrap:wrap">${image}<article style="flex:1;min-width:min(100%,280px)"><p style="color:#ffd700;font-size:13px;font-weight:700;letter-spacing:.08em;margin:0 0 10px">${htmlEscape(route.eyebrow || routeLabel(route.path))}</p><h1 style="font-size:clamp(32px,6vw,64px);line-height:1.02;margin:0 0 18px">${htmlEscape(route.heading)}</h1><p style="max-width:760px;color:#c8c8d2;font-size:clamp(16px,2vw,19px);line-height:1.7">${htmlEscape(route.summary || route.description)}</p><nav aria-label="Explore Anime Orbit" style="display:flex;gap:16px;flex-wrap:wrap;margin-top:28px">${links.map(([href, label]) => `<a href="${href}" style="color:#ffd700;font-weight:700">${label}</a>`).join("")}</nav></article></div></main>`;
};

const renderRoute = (baseHtml, route) => {
  const canonical = canonicalFor(route.path);
  const image = route.image || DEFAULT_IMAGE;
  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(route.title)}</title>`);
  html = replaceMeta(html, "title", "name", route.title);
  html = replaceMeta(html, "description", "name", route.description);
  html = replaceMeta(html, "keywords", "name", `${route.heading}, Anime Orbit, anime, manga, ${routeLabel(route.path)}`);
  html = replaceMeta(html, "og:type", "property", route.schemaType === "ItemPage" ? "article" : "website");
  html = replaceMeta(html, "og:url", "property", canonical);
  html = replaceMeta(html, "og:title", "property", route.title);
  html = replaceMeta(html, "og:description", "property", route.description);
  html = replaceMeta(html, "og:image", "property", image);
  html = replaceMeta(html, "og:image:alt", "property", route.heading);
  html = replaceMeta(html, "twitter:url", "name", canonical);
  html = replaceMeta(html, "twitter:title", "name", route.title);
  html = replaceMeta(html, "twitter:description", "name", route.description);
  html = replaceMeta(html, "twitter:image", "name", image);
  html = html.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, "");
  html = html.replace("</head>", `    <link rel="canonical" href="${htmlEscape(canonical)}" />\n  </head>`);
  html = html.replace(/<script\s+id=["']schema-structured-data["'][^>]*>[\s\S]*?<\/script>/i, `<script id="schema-structured-data" type="application/ld+json">${jsonForHtml(structuredData(route))}</script>`);
  html = html.replace(/<div\s+id=["']root["']>[\s\S]*?<\/div>/i, `<div id="root">${fallbackMarkup(route)}</div>`);
  return html;
};

const baseHtml = await readFile(path.join(buildDirectory, "index.html"), "utf8");
let dynamicRoutes = [];
try {
  dynamicRoutes = JSON.parse(await readFile(routeCache, "utf8"));
} catch {
  console.warn("No generated detail metadata cache was found; prerendering public catalogue routes only.");
}

const routes = [...new Map([...staticRoutes, ...dynamicRoutes].map((entry) => [entry.path, entry])).values()];
for (const route of routes) {
  const outputPath = route.path === "/"
    ? path.join(buildDirectory, "index.html")
    : path.join(buildDirectory, `${route.path.replace(/^\/+/, "")}.html`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderRoute(baseHtml, route), "utf8");
}

console.log(`Prerendered ${routes.length} crawlable Anime Orbit routes.`);
