import { resolveAnimeDigest } from "../lib/anime-digest.mjs";

export async function handler(event) {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: JSON.stringify({ error: "GET required" }) };
  try {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600",
      },
      body: JSON.stringify(await resolveAnimeDigest({ force: event.queryStringParameters?.refresh === "1" })),
    };
  } catch {
    return { statusCode: 200, headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ news: [], quote: null, facts: [] }) };
  }
}
