const BROKEN_UTF8 = new Map([
  ["â€™", "’"],
  ["â€˜", "‘"],
  ["â€œ", "“"],
  ["â€", "”"],
  ["â€“", "–"],
  ["â€”", "—"],
  ["â€¦", "…"],
  ["â€¢", "•"],
  ["Â·", "·"],
  ["Â ", " "],
]);

export const repairProviderText = (value = "") => {
  let clean = String(value);
  for (const [broken, corrected] of BROKEN_UTF8) clean = clean.split(broken).join(corrected);
  return clean;
};
