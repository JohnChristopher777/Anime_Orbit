export interface PopularQuote {
  id: number;
  anime: string;
  character: string;
  line: string;
}

// Familiar series lead the rotation so new visitors get useful anchors before
// the sequence gradually moves into broader catalogue picks.
export const POPULAR_QUOTE_ROTATION: PopularQuote[] = [
  { id: 21, anime: "One Piece", character: "Monkey D. Luffy", line: "If you don't take risks, you can't create a future." },
  { id: 1535, anime: "Death Note", character: "Light Yagami", line: "I will take a potato chip and eat it." },
  { id: 16498, anime: "Attack on Titan", character: "Mikasa Ackerman", line: "The world is cruel, but also very beautiful." },
  { id: 101922, anime: "Demon Slayer", character: "Kyojuro Rengoku", line: "Set your heart ablaze." },
  { id: 20, anime: "Naruto", character: "Naruto Uzumaki", line: "I never go back on my word." },
  { id: 11061, anime: "Hunter x Hunter", character: "Gon Freecss", line: "If you want to get to know someone, find out what makes them angry." },
  { id: 5114, anime: "Fullmetal Alchemist: Brotherhood", character: "Edward Elric", line: "A lesson without pain is meaningless." },
  { id: 101348, anime: "Vinland Saga", character: "Thors", line: "You have no enemies." },
  { id: 9253, anime: "Steins;Gate", character: "Rintaro Okabe", line: "No one knows what the future holds. That's why its potential is infinite." },
  { id: 30, anime: "Neon Genesis Evangelion", character: "Misato Katsuragi", line: "Sometimes you need a little wishful thinking just to keep on living." },
  { id: 1, anime: "Cowboy Bebop", character: "Spike Spiegel", line: "Whatever happens, happens." },
  { id: 20583, anime: "Haikyu!!", character: "Tobio Kageyama", line: "The only ones who will remain on the court are the strong." },
];

export const nextLinearItem = <T,>(items: readonly T[], cursorName: string): T | undefined => {
  if (!items.length) return undefined;
  const storageKey = `animeorbit:rotation:${cursorName}`;
  let cursor = 0;
  try {
    const saved = Number(window.localStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved >= 0) cursor = Math.floor(saved);
    window.localStorage.setItem(storageKey, String((cursor + 1) % items.length));
  } catch {
    // Private browsing can deny storage; the ordered first item remains safe.
  }
  return items[cursor % items.length];
};
