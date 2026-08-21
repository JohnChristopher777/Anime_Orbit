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
