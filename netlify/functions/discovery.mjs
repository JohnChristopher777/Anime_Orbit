import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

// Keep the server-only Gemini credential from becoming an unbounded public
// relay. Netlify enforces this before the function invokes the model.
export const config = {
  path: "/api/discovery",
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};

const unavailablePayload = (reason = "") => ({
  summary: "",
  setting: "",
  characters: [],
  visualDetails: [],
  visibleText: "",
  matches: [],
  configured: false,
  reason,
});

const responseSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    setting: { type: "string" },
    characters: { type: "array", items: { type: "string" } },
    visualDetails: { type: "array", items: { type: "string" } },
    visibleText: { type: "string" },
    matches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          character: { type: "string" },
          quote: { type: "string" },
          episode: { type: "string" },
          reason: { type: "string" },
          confidence: { type: "integer" },
        },
        required: ["title", "reason", "confidence"],
      },
    },
  },
  required: ["summary", "setting", "characters", "visualDetails", "visibleText", "matches"],
};

const isPrivateAddress = (address) => {
  const normalized = String(address || "").toLowerCase().replace(/^::ffff:/, "");
  if (!isIP(normalized)) return true;
  return normalized === "::1" || normalized === "0.0.0.0" ||
    /^(127\.|10\.|169\.254\.|192\.168\.)/.test(normalized) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(normalized) ||
    /^(fc|fd|fe8|fe9|fea|feb)/.test(normalized);
};

const validatedRemoteUrl = async (rawUrl) => {
  const parsed = new URL(String(rawUrl).slice(0, 2048));
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported image URL");
  if (parsed.username || parsed.password) throw new Error("Authenticated image URLs are not allowed");
  if (parsed.port && !["80", "443"].includes(parsed.port)) throw new Error("Unsupported image port");
  const hostname = parsed.hostname.toLowerCase();
  const privateHost = hostname === "localhost" || hostname === "::1" || hostname.endsWith(".local") ||
    /^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe80:");
  if (privateHost) throw new Error("Private image URLs are not allowed");
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private image URLs are not allowed");
  }
  return parsed;
};

const safeRemoteImage = async (rawUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    let parsed = await validatedRemoteUrl(rawUrl);
    let result;
    for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
      result = await fetch(parsed, { signal: controller.signal, redirect: "manual" });
      if (![301, 302, 303, 307, 308].includes(result.status)) break;
      const location = result.headers.get("location");
      if (!location || redirectCount === 3) throw new Error("Unsafe image redirect");
      parsed = await validatedRemoteUrl(new URL(location, parsed).href);
    }
    if (!result) throw new Error("Image could not be downloaded");
    if (!result.ok) throw new Error("Image could not be downloaded");
    const mimeType = result.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
      throw new Error("URL does not point to a supported image");
    }
    const contentLength = Number(result.headers.get("content-length") || 0);
    if (contentLength > 5_500_000) throw new Error("Image is too large");
    const bytes = new Uint8Array(await result.arrayBuffer());
    if (bytes.byteLength > 5_500_000) throw new Error("Image is too large");
    return { mimeType, data: Buffer.from(bytes).toString("base64") };
  } finally {
    clearTimeout(timeout);
  }
};

const promptFor = (kind, text) => {
  const shared = "Return likely canonical anime titles only. Rank at most six candidates. Confidence is 0-100. Be honest when clues are weak; never invent a title. Reasons must be brief and useful to an anime fan.";
  if (kind === "image") return `${shared}\nAnalyze this anime-related image as both an accessibility description and a visual-search request. Write a complete factual summary of the whole frame. Describe foreground and background, characters and their appearance, pose, expression, clothing, action, location, time/weather, lighting and colour, camera composition, important objects, symbols, and any readable on-screen text. Put concise individual observations in visualDetails, transcribe readable text in visibleText, and clearly mark uncertain identifications. Then return likely anime matches. Posters, fan art, manga panels and episode frames are all possible.`;
  if (kind === "dialogue") return `${shared}\nFind the anime and speaker for this remembered or paraphrased dialogue. Correct small wording errors. Put the closest reconstructed line in quote. Include an episode only when you are reasonably certain; otherwise leave it blank. Query: ${text}`;
  if (kind === "character") return `${shared}\nIdentify anime characters matching these remembered appearance and personality traits. Put the canonical character name in character, their canonical anime in title, and explain which traits match. Query: ${text}`;
  return `${shared}\nFind anime matching this remembered scene. Pay attention to characters, location, era, clothing, powers, objects and plot action. Query: ${text}`;
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: "POST required" }) };
  if (String(event.body || "").length > 5_500_000) return { statusCode: 413, headers: JSON_HEADERS, body: JSON.stringify({ error: "Request is too large" }) };
  const apiKey = process.env.GEMINI_API_KEY;
  // Discovery has catalogue and Trace.moe fallbacks in the client. A missing or
  // temporarily unavailable Gemini service must not turn those searches into a 503.
  if (!apiKey) return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(unavailablePayload("AI discovery is not configured")) };

  try {
    const body = JSON.parse(event.body || "{}");
    const kind = ["image", "scene", "dialogue", "character"].includes(body.kind) ? body.kind : "scene";
    const text = String(body.text || "").trim().slice(0, 2200);
    const parts = [{ text: promptFor(kind, text) }];

    if (kind === "image") {
      let image = null;
      if (body.imageData && body.mimeType) image = { mimeType: String(body.mimeType), data: String(body.imageData) };
      else if (body.imageUrl) image = await safeRemoteImage(String(body.imageUrl));
      if (!image || !image.mimeType.startsWith("image/") || image.data.length > 7_500_000) throw new Error("A valid image is required");
      parts.unshift({ inlineData: image });
    } else if (!text) {
      throw new Error("Search text is required");
    }

    const model = "gemini-3.6-flash";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 24000);
    let result;
    try {
      result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 1200, responseMimeType: "application/json", responseSchema },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!result.ok) throw new Error(`Gemini request failed (${result.status})`);
    const payload = await result.json();
    const textResult = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    const parsed = JSON.parse(textResult);
    parsed.visualDetails = Array.isArray(parsed.visualDetails) ? parsed.visualDetails.slice(0, 10).filter(Boolean) : [];
    parsed.visibleText = String(parsed.visibleText || "").slice(0, 800);
    parsed.matches = Array.isArray(parsed.matches) ? parsed.matches.slice(0, 6).filter((match) => match?.title) : [];
    parsed.configured = true;
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(parsed) };
  } catch (error) {
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(unavailablePayload(error?.message || "AI discovery failed")) };
  }
};
