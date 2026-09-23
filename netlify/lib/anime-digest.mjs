const REQUEST_TIMEOUT_MS = 7000;
let cachedDigest = null;

const ARCHIVE_QUOTES = [
  { content: "If you don't take risks, you can't create a future.", anime: "One Piece", character: "Monkey D. Luffy" },
  { content: "The world is cruel, but also very beautiful.", anime: "Attack on Titan", character: "Mikasa Ackerman" },
  { content: "Set your heart ablaze.", anime: "Demon Slayer: Kimetsu no Yaiba", character: "Kyojuro Rengoku" },
  { content: "You have no enemies.", anime: "Vinland Saga", character: "Thors" },
  { content: "Whatever happens, happens.", anime: "Cowboy Bebop", character: "Spike Spiegel" },
];

async function fetchRemote(url, type = "json") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: type === "json" ? "application/json" : "application/rss+xml, application/xml, text/xml", "User-Agent": "AnimeOrbit/1.0" },
    });
    if (!response.ok) throw new Error(`Remote provider returned ${response.status}`);
    return type === "json" ? response.json() : response.text();
  } finally {
    clearTimeout(timeout);
  }
}

const decodeXml = (value = "") => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ")
  .trim();

const xmlValue = (block, tag) => {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] || "");
};

async function getNews() {
  const xml = await fetchRemote("https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us", "text");
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match) => ({
    title: xmlValue(match[1], "title"),
    url: xmlValue(match[1], "link") || xmlValue(match[1], "guid"),
    summary: xmlValue(match[1], "description").slice(0, 260),
    publishedAt: xmlValue(match[1], "pubDate"),
    source: "Anime News Network",
  })).filter((item) => item.title && item.url);
}

async function getQuote() {
  let row;
  try {
    const payload = await fetchRemote("https://api.animechan.io/v1/quotes/random");
    row = payload?.data || payload;
  } catch {
    row = ARCHIVE_QUOTES[Math.floor(Date.now() / 86400000) % ARCHIVE_QUOTES.length];
  }
  if (!row?.content) row = ARCHIVE_QUOTES[0];
  const anime = String(row.anime?.name || row.anime || "Unknown anime");
  const character = String(row.character?.name || row.character || "Unknown character");
  let characterImage = "";
  let characterId = null;
  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "content-type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `query ($character: String, $anime: String) {
          Page(page: 1, perPage: 3) { characters(search: $character, sort: SEARCH_MATCH) { id name { full } image { large } media(type: ANIME, perPage: 5, sort: POPULARITY_DESC) { nodes { title { english romaji } } } } }
          Media(search: $anime, type: ANIME) { coverImage { extraLarge large } bannerImage }
        }`,
        variables: { character, anime },
      }),
    });
    if (response.ok) {
      const data = (await response.json())?.data || {};
      const candidates = data?.Page?.characters || [];
      const normalizedAnime = anime.toLowerCase();
      const match = candidates.find((candidate) => candidate.media?.nodes?.some((media) => [media.title?.english, media.title?.romaji].filter(Boolean).some((title) => normalizedAnime.includes(String(title).toLowerCase()) || String(title).toLowerCase().includes(normalizedAnime)))) || candidates[0];
      characterImage = match?.image?.large || data?.Media?.coverImage?.extraLarge || data?.Media?.coverImage?.large || data?.Media?.bannerImage || "";
      characterId = match?.id || null;
    }
  } catch {
    // The quote remains useful when AniList cannot supply character artwork.
  }
  if (!characterImage) {
    try {
      const payload = await fetchRemote(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(character)}&limit=1`);
      const candidate = payload?.data?.[0];
      characterImage = candidate?.images?.webp?.image_url || candidate?.images?.jpg?.image_url || "";
      characterId = characterId || candidate?.mal_id || null;
    } catch {
      // Continue to the anime-cover fallback below.
    }
  }
  if (!characterImage) {
    try {
      const payload = await fetchRemote(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(anime)}&limit=1&sfw=true`);
      const media = payload?.data?.[0];
      characterImage = media?.images?.webp?.large_image_url || media?.images?.jpg?.large_image_url || media?.images?.jpg?.image_url || "";
    } catch {
      // The component displays its designed quote fallback when every image provider is unavailable.
    }
  }
  return {
    content: String(row.content),
    anime,
    character,
    characterImage,
    characterId,
    source: row === ARCHIVE_QUOTES[0] || ARCHIVE_QUOTES.includes(row) ? "Anime Orbit archive" : "AnimeChan",
  };
}

async function getFacts() {
  const slugs = ["one_piece", "bleach", "naruto", "fma_brotherhood", "attack_on_titan", "demon_slayer"];
  const day = Math.floor(Date.now() / 86400000);
  const slug = slugs[day % slugs.length];
  const payload = await fetchRemote(`https://anime-facts-rest-api.herokuapp.com/api/v1/${slug}`);
  return (payload?.data || []).slice(0, 4).map((row) => ({
    id: `${slug}-${row.fact_id}`,
    anime: slug.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    content: String(row.fact || "").trim(),
    image: payload?.anime_img || "",
    source: "AnimeFacts",
  })).filter((fact) => fact.content);
}

export async function resolveAnimeDigest({ force = false } = {}) {
  const now = Date.now();
  if (!force && cachedDigest?.expiresAt > now) return cachedDigest.value;
  const [news, quote, facts] = await Promise.allSettled([getNews(), getQuote(), getFacts()]);
  const value = {
    news: news.status === "fulfilled" ? news.value : [],
    quote: quote.status === "fulfilled" ? quote.value : null,
    facts: facts.status === "fulfilled" ? facts.value : [],
    generatedAt: new Date().toISOString(),
  };
  cachedDigest = { expiresAt: now + 15 * 60 * 1000, value };
  return value;
}
