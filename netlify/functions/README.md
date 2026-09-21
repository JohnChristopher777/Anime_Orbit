# Gemini discovery function

The browser calls `/.netlify/functions/discovery`; the Gemini key is never bundled into Vite.

Configure these server environment variables in Netlify before deploying:

- `GEMINI_API_KEY` — required.
- `GEMINI_MODEL` — optional; defaults to `gemini-2.5-flash`.

The function accepts image, scene-description, and dialogue requests, constrains Gemini to structured JSON, then the client resolves the returned canonical titles against AniList. If the function is unavailable, the existing trace.moe and AniList matching paths remain usable.
