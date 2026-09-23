const ACDB_ENDPOINT = "https://www.animecharactersdatabase.com/api_series_characters.php";

const findRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of ["characters", "results", "search_results", "data"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
};

export async function searchAcdbCharacters(query) {
  const clean = String(query || "").trim().slice(0, 120);
  if (!clean) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${ACDB_ENDPOINT}?character_q=${encodeURIComponent(clean)}`, {
      headers: { Accept: "application/json", "User-Agent": "AnimeOrbit/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const rows = findRows(await response.json());
    return rows.slice(0, 12).map((row) => ({
      id: row.id || row.character_id || row.characterId || null,
      name: row.name || row.character_name || row.character || "",
      image: row.image || row.character_image || row.thumbnail || "",
      anime: row.anime || row.anime_name || row.series || row.title || "",
      sourceUrl: row.url || row.character_url || "",
    })).filter((row) => row.name);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
