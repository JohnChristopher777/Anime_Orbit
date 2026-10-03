import { searchAcdbCharacters } from "../lib/acdb-characters.mjs";
import { corsHeaders, corsPreflight } from "../lib/cors.mjs";

const headers = (event) => ({ ...corsHeaders(event), "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" });
export const handler = async (event) => {
  const preflight = corsPreflight(event, "GET, OPTIONS");
  if (preflight) return preflight;
  if (event.httpMethod !== "GET") return { statusCode: 405, headers: headers(event), body: JSON.stringify({ error: "GET required" }) };
  const query = String(event.queryStringParameters?.q || "").trim().slice(0, 180);
  const characters = query ? await searchAcdbCharacters(query) : [];
  return { statusCode: 200, headers: headers(event), body: JSON.stringify({ characters, source: "ACDB" }) };
};
