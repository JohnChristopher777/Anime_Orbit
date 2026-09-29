import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "../firebase/config";
import { sanitizeHandle } from "../utils/security";

const handleKey = (value: string) => sanitizeHandle(value).toLowerCase();

export const validateProfileHandle = (value: unknown): string | null => {
  const handle = sanitizeHandle(value);
  if (!handle) return "A profile ID is required";
  if (handle.length < 3) return "Profile ID must have at least 3 characters";
  if (handle.length > 24) return "Profile ID must be 24 characters or less";
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(handle))
    return "Use letters, numbers, underscores or hyphens, starting with a letter or number";
  return null;
};

export const isProfileHandleAvailable = async (value: string, uid?: string) => {
  if (validateProfileHandle(value)) return false;
  const snapshot = await getDoc(doc(db, "handles", handleKey(value)));
  return !snapshot.exists() || snapshot.data()?.uid === uid;
};

export const claimProfileHandle = async (uid: string, value: string, previousValue = "") => {
  const handle = sanitizeHandle(value);
  const validation = validateProfileHandle(handle);
  if (validation) throw Object.assign(new Error(validation), { code: "profile/invalid-handle" });
  const key = handleKey(handle);
  const previousKey = handleKey(previousValue);

  await runTransaction(db, async (transaction) => {
    const reference = doc(db, "handles", key);
    const snapshot = await transaction.get(reference);
    const previousReference = previousKey && previousKey !== key ? doc(db, "handles", previousKey) : null;
    const previousSnapshot = previousReference ? await transaction.get(previousReference) : null;
    if (snapshot.exists() && snapshot.data()?.uid !== uid)
      throw Object.assign(new Error("That profile ID is already taken"), { code: "profile/handle-taken" });
    transaction.set(reference, { uid, handle, updatedAt: new Date().toISOString() });
    if (previousReference && previousSnapshot?.exists() && previousSnapshot.data()?.uid === uid)
      transaction.delete(previousReference);
  });
  return handle;
};

export const createAvailableProfileHandle = async (uid: string, displayName: string, preferred = "") => {
  const base = sanitizeHandle(preferred || displayName.replace(/\s+/g, "")) || "AnimeFan";
  const suffix = uid.replace(/[^A-Za-z0-9]/g, "").slice(-5) || "Orbit";
  const candidates = [base, `${base.slice(0, 18)}${suffix}`, `Orbit${suffix}`];
  for (const candidate of candidates) {
    try {
      return await claimProfileHandle(uid, candidate);
    } catch (error: any) {
      if (error?.code !== "profile/handle-taken") throw error;
    }
  }
  return claimProfileHandle(uid, `Orbit${Date.now().toString(36).slice(-8)}`);
};
