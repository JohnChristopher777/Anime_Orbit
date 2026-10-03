import { fetchAnimeQuotes, fetchRandomAnimeQuote } from "../lib/anime-quotes.mjs";
import { corsHeaders, corsPreflight } from "../lib/cors.mjs";

const headers = (event) => ({ ...corsHeaders(event), "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });

export const handler = async (event) => {
  const preflight = corsPreflight(event, "GET, OPTIONS");
  if (preflight) return preflight;
  if (event.httpMethod !== "GET") return { statusCode: 405, headers: headers(event), body: JSON.stringify({ error: "GET required" }) };
  const query = String(event.queryStringParameters?.q || event.queryStringParameters?.character || "").trim().slice(0, 240);
  if (query) {
    const quotes = await fetchAnimeQuotes(query);
    return { statusCode: 200, headers: headers(event), body: JSON.stringify({ quotes, available: quotes.length > 0 }) };
  }
  const quote = await fetchRandomAnimeQuote();
  return { statusCode: 200, headers: headers(event), body: JSON.stringify({ quote, available: Boolean(quote) }) };
};
