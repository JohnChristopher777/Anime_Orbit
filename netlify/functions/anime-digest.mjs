import { resolveAnimeDigest } from "../lib/anime-digest.mjs";
import { corsHeaders, corsPreflight } from "../lib/cors.mjs";

export async function handler(event) {
  const preflight = corsPreflight(event, "GET, OPTIONS");
  if (preflight) return preflight;
  if (event.httpMethod !== "GET") return { statusCode: 405, headers: corsHeaders(event), body: JSON.stringify({ error: "GET required" }) };
  try {
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(event),
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600",
      },
      body: JSON.stringify(await resolveAnimeDigest({ force: event.queryStringParameters?.refresh === "1" })),
    };
  } catch {
    return { statusCode: 200, headers: { ...corsHeaders(event), "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ news: [], quote: null, facts: [] }) };
  }
}
