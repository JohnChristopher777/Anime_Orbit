/**
 * Security & Input Sanitization Utilities for AnimeOrbit
 * Prevents XSS, Prototype Pollution, and Injection Attacks.
 */

// Basic HTML entity encoding to prevent XSS in user-generated strings
export const sanitizeHtml = (str: string): string => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Clean and validate general text inputs (comments, reviews, bio, notes)
export const sanitizeInput = (text: string, maxLength: number = 2000): string => {
  if (!text || typeof text !== "string") return "";
  // Strip control characters, normalize whitespace, and enforce maximum length
  return text
    .trim()
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .slice(0, maxLength);
};

// Accept only URLs that browsers can safely render without executing script.
// Root-relative asset paths are allowed for bundled profile presets.
export const safeImageUrl = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const candidate = value.trim().slice(0, 2048);
  if (/^\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp|gif)$/i.test(candidate)) {
    return candidate;
  }
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
};

export const sanitizeHandle = (value: unknown): string =>
  typeof value === "string"
    ? value.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24)
    : "";

// Client-side rate-limiting anti-spam helper (in-memory per action key)
const actionTimestamps: Map<string, number> = new Map();

export const checkRateLimit = (actionKey: string, cooldownMs: number = 3000): boolean => {
  const now = Date.now();
  const lastTime = actionTimestamps.get(actionKey) || 0;
  if (now - lastTime < cooldownMs) {
    return false; // Rate limited
  }
  actionTimestamps.set(actionKey, now);
  return true; // Allowed
};
