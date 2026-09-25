const REQUEST_TIMEOUT_MS = 6500;

const normaliseTitle = (value = "") => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const mangaDexAccessToken = () => {
  return String(process.env.MANGADEX_ACCESS_TOKEN || "").trim();
};

async function fetchJson(url, attempts = 2) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const accessToken = mangaDexAccessToken();
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "AnimeOrbit/1.0",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
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

function orderedAggregateChapters(aggregate) {
  const chapters = [];
  Object.values(aggregate?.volumes || {}).forEach((volume) => {
    Object.values(volume?.chapters || {}).forEach((chapter) => {
      const number = Number.parseFloat(chapter?.chapter);
      if (Number.isFinite(number) && chapter?.id) chapters.push({ number, id: chapter.id });
    });
  });
  return [...new Map(chapters
    .sort((left, right) => left.number - right.number)
    .map((chapter) => [chapter.number, chapter])).values()];
}

async function chapterDetails(chapters) {
  if (!chapters.length) return [];
  const url = new URL("https://api.mangadex.org/chapter");
  chapters.forEach((chapter) => url.searchParams.append("ids[]", chapter.id));
  url.searchParams.set("limit", String(Math.min(100, chapters.length)));
  url.searchParams.append("includes[]", "scanlation_group");
  const response = await fetchJson(url);
  const details = new Map((response?.data || []).map((chapter) => [chapter.id, chapter.attributes || {}]));
  return chapters.map((chapter) => {
    const attributes = details.get(chapter.id) || {};
    const publishedTitle = String(attributes.title || "").trim();
    return {
      mal_id: chapter.id,
      number: chapter.number,
      title: publishedTitle || `Chapter ${chapter.number}`,
      summary: "",
      thumbnail: "",
      aired: attributes.publishAt || attributes.readableAt || attributes.createdAt || null,
      pages: Number(attributes.pages || 0),
      externalUrl: attributes.externalUrl || null,
      metadataAvailable: Boolean(publishedTitle || attributes.publishAt || attributes.readableAt || attributes.pages),
      source: "MangaDex",
    };
  });
}

export async function resolveMangaMetadata({ malId, title, offset = 0, limit = 50 }) {
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
  const ordered = orderedAggregateChapters(aggregate);
  const safeOffset = Math.max(0, Number(offset) || 0);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 50));
  const selected = ordered.slice(safeOffset, safeOffset + safeLimit);
  let chapters;
  try {
    chapters = await chapterDetails(selected);
  } catch {
    chapters = selected.map((chapter) => ({
      mal_id: chapter.id,
      number: chapter.number,
      title: `Chapter ${chapter.number}`,
      summary: "",
      thumbnail: "",
      aired: null,
      pages: 0,
      metadataAvailable: false,
      source: "MangaDex",
    }));
  }
  return { chapterCount, mangaDexId: match.id, chapters };
}
