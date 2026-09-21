import { resolveMangaMetadata } from "../lib/manga-metadata.mjs";

export async function handler(event) {
  const malId = String(event.queryStringParameters?.malId || "").slice(0, 20);
  const title = String(event.queryStringParameters?.title || "").trim().slice(0, 180);
  if (!title) {
    return { statusCode: 400, body: JSON.stringify({ error: "A manga title is required." }) };
  }
  try {
    const metadata = await resolveMangaMetadata({ malId, title });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=21600, stale-while-revalidate=86400",
      },
      body: JSON.stringify(metadata),
    };
  } catch {
    // A supplemental provider outage must not break the manga page. AniList
    // remains the primary count source and the client can continue with zero.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60" },
      body: JSON.stringify({ chapterCount: 0, mangaDexId: null, sourceUnavailable: true }),
    };
  }
}
