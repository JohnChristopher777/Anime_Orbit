const statusToken = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

export const isOngoingMediaStatus = (value: unknown) =>
  [
    "currentlyairing",
    "currentlypublishing",
    "releasing",
    "publishing",
    "ongoing",
  ].includes(statusToken(value));

export const isFinishedMediaStatus = (value: unknown) =>
  [
    "finishedairing",
    "finishedpublishing",
    "finished",
    "completed",
  ].includes(statusToken(value));

/**
 * Reaching the latest known release is not the same as finishing an ongoing
 * series. Keep ongoing titles caught up and reserve Completed for concluded
 * anime and manga.
 */
export const statusAtKnownTotal = (
  releaseStatus: unknown,
  fallback: "Completed" | "Caught Up" = "Completed",
) => {
  if (isOngoingMediaStatus(releaseStatus)) return "Caught Up";
  if (isFinishedMediaStatus(releaseStatus)) return "Completed";
  return fallback;
};

