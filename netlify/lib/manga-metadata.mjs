const REQUEST_TIMEOUT_MS = 6500;

const normaliseTitle = (value = "") => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function fetchJson(url, attempts = 2) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json", "User-Agent": "AnimeOrbit/1.0" },
      });
      if (!response.ok) throw new Error(`MangaDex returned ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function titlesFor(entry) {
  return [entry?.attributes?.title, ...(entry?.attributes?.altTitles || [])]
    .flatMap((value) => value && typeof value === "object" ? Object.values(value) : [])
    .filter(Boolean);
}

function highestChapter(aggregate) {
  let highest = 0;
  Object.values(aggregate?.volumes || {}).forEach((volume) => {
    Object.values(volume?.chapters || {}).forEach((chapter) => {
      const value = Number.parseFloat(chapter?.chapter);
      if (Number.isFinite(value)) highest = Math.max(highest, value);
    });
  });
  return Math.ceil(highest);
}

export async function resolveMangaMetadata({ malId, title }) {
  if (!title) return { chapterCount: 0, mangaDexId: null };
  const searchUrl = new URL("https://api.mangadex.org/manga");
  searchUrl.searchParams.set("title", title);
  searchUrl.searchParams.set("limit", "10");
  const search = await fetchJson(searchUrl);
  const candidates = search?.data || [];
  const wantedTitle = normaliseTitle(title);
  const match = candidates.find((entry) => String(entry?.attributes?.links?.mal || "") === String(malId || ""))
    || candidates.find((entry) => titlesFor(entry).some((candidate) => normaliseTitle(candidate) === wantedTitle));
  if (!match?.id) return { chapterCount: 0, mangaDexId: null };

  const aggregateUrl = new URL(`https://api.mangadex.org/manga/${match.id}/aggregate`);
  aggregateUrl.searchParams.append("translatedLanguage[]", "en");
  let aggregate = await fetchJson(aggregateUrl);
  let chapterCount = highestChapter(aggregate);
  if (!chapterCount) {
    aggregate = await fetchJson(`https://api.mangadex.org/manga/${match.id}/aggregate`);
    chapterCount = highestChapter(aggregate);
  }
  return { chapterCount, mangaDexId: match.id };
}
