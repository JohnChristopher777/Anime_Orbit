const NETLIFY_FUNCTIONS = "https://shonenanimeorbit.netlify.app/.netlify/functions";

const productionApiBase = () => {
  const configured = String(import.meta.env.VITE_SERVERLESS_API_BASE || "").trim().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.hostname === "shonenanimeorbit.netlify.app") return "/api";
  return NETLIFY_FUNCTIONS;
};

export const serverApiUrl = (endpoint: string, params?: URLSearchParams) => {
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  const base = import.meta.env.DEV ? "/api" : productionApiBase();
  const url = `${base}/${cleanEndpoint}`;
  const query = params?.toString();
  return query ? `${url}?${query}` : url;
};
