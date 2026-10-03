const TRUSTED_ORIGINS = new Set([
  "https://animeorbit.web.app",
  "https://animeorbit.firebaseapp.com",
  "https://shonenanimeorbit.netlify.app",
]);

export const corsHeaders = (event, methods = "GET, OPTIONS") => {
  const origin = String(event?.headers?.origin || event?.headers?.Origin || "").trim();
  return {
    "Access-Control-Allow-Origin": TRUSTED_ORIGINS.has(origin) ? origin : "https://animeorbit.web.app",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
};

export const corsPreflight = (event, methods) => event?.httpMethod === "OPTIONS"
  ? { statusCode: 204, headers: corsHeaders(event, methods), body: "" }
  : null;
