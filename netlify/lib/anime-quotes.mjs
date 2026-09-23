const SOURCES = [
  "https://animechan.io/api/v1/quotes/random",
  "https://api.animechan.io/v1/quotes/random",
];

const normalise = (payload) => {
  const row = payload?.data || payload?.quote || payload;
  const content = row?.content || row?.quote || "";
  const anime = row?.anime?.name || row?.anime || "";
  const character = row?.character?.name || row?.character || "";
  if (!content || !anime || !character) return null;
  return { line: String(content), anime: String(anime), character: String(character), source: "AnimeChan" };
};

const normaliseRows = (payload) => {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.quotes)
        ? payload.quotes
        : [];
  return rows.map(normalise).filter(Boolean);
};

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "AnimeOrbit/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export async function fetchAnimeQuotes(query, maxPages = 4) {
  const clean = String(query || "").trim().slice(0, 100);
  if (!clean) return [];
  const collected = [];
  for (let page = 1; page <= Math.min(6, Math.max(1, maxPages)); page += 1) {
    const payload = await fetchJson(
      `https://api.animechan.io/v1/quotes?character=${encodeURIComponent(clean)}&page=${page}`,
    );
    const rows = normaliseRows(payload);
    if (!rows.length) break;
    collected.push(...rows);
    if (rows.length < 5) break;
  }
  if (!collected.length) {
    const legacy = await fetchJson(
      `https://animechan.vercel.app/api/quotes/character?name=${encodeURIComponent(clean)}`,
    );
    collected.push(...normaliseRows(legacy));
  }
  return [...new Map(collected.map((row) => [
    `${row.character}:${row.anime}:${row.line}`.toLowerCase(),
    row,
  ])).values()].slice(0, 30);
}

export async function fetchRandomAnimeQuote() {
  for (const url of SOURCES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
      if (!response.ok) continue;
      const quote = normalise(await response.json());
      if (quote) return quote;
    } catch {
      // Try the compatible endpoint before reporting that the provider is down.
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}
