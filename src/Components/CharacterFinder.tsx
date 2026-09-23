import React from "react";
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { getPopularCharacters, searchCharacters } from "../services/anilist";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";

const POPULAR_FALLBACK_NAMES = ["Luffy Monkey", "Satoru Gojou", "Levi", "Naruto Uzumaki"];

const ATTRIBUTE_CANDIDATES: Record<string, Record<string, string[]>> = {
  hair: {
    Black: ["Monkey D. Luffy", "Sasuke Uchiha", "Levi Ackerman", "Megumi Fushiguro"],
    Blonde: ["Naruto Uzumaki", "Sanji", "Edward Elric", "Violet Evergarden"],
    Brown: ["Light Yagami", "Eren Yeager", "Haruhi Suzumiya", "Taiga Aisaka"],
    Blue: ["Rem", "Rei Ayanami", "Ami Mizuno", "Nagisa Shiota"],
    Red: ["Shanks", "Erza Scarlet", "Karma Akabane", "Yoko Littner"],
    Pink: ["Anya Forger", "Natsu Dragneel", "Madoka Kaname", "Zero Two"],
    Purple: ["Shinobu Kochou", "Hitagi Senjougahara", "Yoruichi Shihouin"],
    Green: ["Roronoa Zoro", "Izuku Midoriya", "Tatsumaki", "C.C."],
    White: ["Satoru Gojou", "Killua Zoldyck", "Frieren", "Kakashi Hatake"],
    Gray: ["Gintoki Sakata", "Kakashi Hatake", "Near"],
  },
  eyes: {
    Black: ["Monkey D. Luffy", "Levi Ackerman", "Mikasa Ackerman"],
    Brown: ["Light Yagami", "Eren Yeager", "Ochako Uraraka"],
    Blue: ["Naruto Uzumaki", "Satoru Gojou", "Violet Evergarden"],
    Green: ["Roronoa Zoro", "Izuku Midoriya", "C.C."],
    Red: ["Kurumi Tokisaki", "Shalltear Bloodfallen", "Alucard"],
    Purple: ["Shinobu Kochou", "Rukia Kuchiki", "Yoruichi Shihouin"],
    Yellow: ["Killua Zoldyck", "Power", "Kyoujurou Rengoku"],
    Gray: ["Frieren", "Vladilena Milize", "Ken Kaneki"],
  },
  gender: {
    Female: ["Frieren", "Mikasa Ackerman", "Violet Evergarden", "Anya Forger"],
    Male: ["Monkey D. Luffy", "Roronoa Zoro", "Satoru Gojou", "Naruto Uzumaki"],
    Androgynous: ["Hange Zoe", "Crona", "Najimi Osana"],
    Ambiguous: ["Hange Zoe", "Crona", "Nanachi"],
  },
  age: {
    Child: ["Anya Forger", "Kanna Kamui", "Bojji"],
    Teenager: ["Izuku Midoriya", "Naruto Uzumaki", "Killua Zoldyck", "Mikasa Ackerman"],
    Adult: ["Roronoa Zoro", "Satoru Gojou", "Levi Ackerman", "Yor Forger"],
    Senior: ["Isaac Netero", "Silvers Rayleigh", "Genryuusai Yamamoto"],
    Ageless: ["Frieren", "C.C.", "Alucard"],
  },
  hairLength: {
    "To ears": ["Roronoa Zoro", "Levi Ackerman", "Izuku Midoriya"],
    "To neck": ["Light Yagami", "Satoru Gojou", "Mikasa Ackerman"],
    "To shoulders": ["Violet Evergarden", "Rukia Kuchiki", "Nobara Kugisaki"],
    "To chest": ["Yor Forger", "Erza Scarlet", "C.C."],
    "To waist": ["Shinobu Kochou", "Zero Two", "Kurumi Tokisaki"],
    "Past hips": ["Raphtalia", "Tohru", "Shalltear Bloodfallen"],
    "Hair up": ["Saber", "Yoruichi Shihouin", "Momo Yaoyorozu"],
  },
  ears: {
    "No animal ears": ["Roronoa Zoro", "Monkey D. Luffy", "Satoru Gojou"],
    Elf: ["Frieren", "Marcille Donato", "Emilia"],
    Animal: ["Raphtalia", "Holo", "Nanachi"],
    Horns: ["Zero Two", "Power", "Kanna Kamui"],
  },
  role: {
    Protagonist: ["Monkey D. Luffy", "Naruto Uzumaki", "Izuku Midoriya", "Frieren"],
    Antagonist: ["Light Yagami", "Sosuke Aizen", "Meruem", "Dio Brando"],
    Main: ["Roronoa Zoro", "Mikasa Ackerman", "Killua Zoldyck", "Satoru Gojou"],
    Supporting: ["Levi Ackerman", "Kakashi Hatake", "Shinobu Kochou", "Tatsumaki"],
  },
};

const attributeCandidateNames = (selections: Record<string, string>) => {
  const scores = new Map<string, number>();
  Object.entries(selections).forEach(([group, value]) => {
    if (!value) return;
    (ATTRIBUTE_CANDIDATES[group]?.[value] || []).forEach((name) =>
      scores.set(name, (scores.get(name) || 0) + 1),
    );
  });
  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([name]) => name)
    .slice(0, 12);
};

const ChoiceGroup: React.FC<{
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}> = ({ label, value, values, onChange }) => (
  <fieldset className="character-choice-group">
    <legend>{label}</legend>
    <div>
      {values.map((option) => (
        <button
          type="button"
          key={option}
          aria-pressed={value === option}
          onClick={() => onChange(value === option ? "" : option)}
        >
          {option}
        </button>
      ))}
    </div>
  </fieldset>
);

export const CharacterFinderWorkspace: React.FC = () => {
  const [name, setName] = React.useState("");
  const [hair, setHair] = React.useState("");
  const [eyes, setEyes] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [age, setAge] = React.useState("");
  const [hairLength, setHairLength] = React.useState("");
  const [ears, setEars] = React.useState("");
  const [role, setRole] = React.useState("");
  const [traits, setTraits] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [resultLabel, setResultLabel] = React.useState("Popular characters");
  const [sourceNote, setSourceNote] = React.useState("Browse without entering a name, or narrow the catalogue with any details you remember.");
  const outputRef = React.useRef<HTMLDivElement | null>(null);

  const revealResults = React.useCallback(() => {
    if (!window.matchMedia("(max-width: 920px)").matches) return;
    window.requestAnimationFrame(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const loadPopular = React.useCallback(async (reveal = false) => {
    setLoading(true);
    setError("");
    try {
      const rows = await getPopularCharacters(20);
      setResults(rows);
      setResultLabel("Popular characters");
      setSourceNote("A starting set of widely followed characters. Your mature-content preference is respected.");
      if (reveal) revealResults();
    } catch {
      const fallback = await Promise.allSettled(POPULAR_FALLBACK_NAMES.map((candidate) => searchCharacters(candidate, 2)));
      const rows = [...new Map(fallback.flatMap((entry) => entry.status === "fulfilled" ? entry.value : []).map((character: any) => [character.id, character])).values()] as any[];
      setResults(rows);
      setResultLabel(rows.length ? "Popular character matches" : "Character catalogue unavailable");
      setError(rows.length ? "The popularity feed was unavailable, so verified character matches are shown instead." : "The character catalogue could not connect. Try again shortly.");
      if (reveal) revealResults();
    } finally {
      setLoading(false);
    }
  }, [revealResults]);

  React.useEffect(() => {
    void loadPopular();
    const refresh = () => void loadPopular(false);
    window.addEventListener("orbit_mature_content_changed", refresh);
    return () => window.removeEventListener("orbit_mature_content_changed", refresh);
  }, [loadPopular]);

  const runCharacterSearch = async () => {
    const clues = [name && `name resembles ${name}`, hair && `${hair} hair`, eyes && `${eyes} eyes`, hairLength && `${hairLength} hair length`, gender, age && `appears ${age}`, ears && `${ears} ears`, role && `${role} role`, traits].filter(Boolean).join(", ");
    if (!clues) {
      await loadPopular(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const seededNames = attributeCandidateNames({ hair, eyes, gender, age, hairLength, ears, role });
      const requests: Promise<any>[] = [getPopularCharacters(20)];
      if (name.trim()) requests.push(searchCharacters(name.trim(), 18));
      const [popularResult, directResult, catalogueResult, aiResult, seededResult] = await Promise.allSettled([
        requests[0],
        requests[1] || Promise.resolve([]),
        name.trim() ? fetch(`/api/characters?q=${encodeURIComponent(name.trim())}`).then((response) => response.json()) : Promise.resolve({ characters: [] }),
        fetch("/api/discovery", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "character", text: clues }) }).then((response) => response.json()),
        Promise.allSettled(seededNames.map((candidate) => searchCharacters(candidate, 2))),
      ]);
      const popular = popularResult.status === "fulfilled" ? popularResult.value || [] : [];
      const direct = directResult.status === "fulfilled" ? directResult.value || [] : [];
      const catalogueRows = catalogueResult.status === "fulfilled" ? catalogueResult.value?.characters || [] : [];
      const aiRows = aiResult.status === "fulfilled" ? aiResult.value?.matches || [] : [];
      const seeded = seededResult.status === "fulfilled"
        ? seededResult.value.flatMap((entry) => entry.status === "fulfilled" ? entry.value : [])
        : [];
      const candidateNames = [...new Set([...catalogueRows.map((row: any) => row.name), ...aiRows.map((row: any) => row.character)].filter(Boolean))].slice(0, 10) as string[];
      const candidateResults = await Promise.allSettled(candidateNames.map((candidate) => searchCharacters(candidate, 4)));
      const matched = [...new Map([...direct, ...seeded, ...candidateResults.flatMap((entry) => entry.status === "fulfilled" ? entry.value : [])].filter((character: any) => character?.id).map((character: any) => [character.id, character])).values()] as any[];
      const related = popular.filter((character: any) => !matched.some((match) => match.id === character.id));
      const combined = [
        ...matched.map((character) => ({ ...character, __resultKind: name.trim() ? "Name match" : seededNames.length ? "Attribute match" : "Clue match" })),
        ...related.map((character: any) => ({ ...character, __resultKind: "Related suggestion" })),
      ].slice(0, 20);
      setResults(combined);
      setResultLabel(matched.length ? `${matched.length} close matches + related characters` : "No exact match — related characters");
      setSourceNote(matched.length ? "Matches are ranked from the selected appearance, role, name, and distinctive details." : "Related catalogue suggestions are shown when no close match is available.");
      if (!combined.length) setError("No characters allowed by the current mature-content preference were returned.");
      revealResults();
    } catch {
      setError("Character matching failed. Popular related characters are being restored.");
      await loadPopular();
    } finally {
      setLoading(false);
    }
  };

  const findCharacters = (event: React.FormEvent) => {
    event.preventDefault();
    void runCharacterSearch();
  };

  const choicesReady = React.useRef(false);
  React.useEffect(() => {
    if (!choicesReady.current) {
      choicesReady.current = true;
      return;
    }
    const timeout = window.setTimeout(() => void runCharacterSearch(), 220);
    return () => window.clearTimeout(timeout);
    // Selection buttons intentionally trigger a fresh search; free-text fields
    // remain submit-driven so typing does not create a request per keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hair, eyes, gender, age, hairLength, ears, role]);

  return <section className="discovery-workbench discovery-workbench--characters">
    <aside className="discovery-input-panel">
      <span className="discovery-panel-kicker">Character discovery</span>
      <h2>Describe who you remember</h2>
      <p>Search by name, or select visible traits to find matching characters without knowing a name.</p>
      <form className="character-workbench-form" onSubmit={findCharacters}>
        <label><span>Character name <small>or use the filters below</small></span><div className="character-inline-input"><Search size={16} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name or partial name" /></div></label>
        <section className="character-visible-filters" aria-label="Appearance and story filters">
          <header><SlidersHorizontal size={15} /><span>Appearance and story filters</span></header>
        <div className="character-compact-filters">
          <ChoiceGroup label="Hair colour" value={hair} onChange={setHair} values={["Black", "Blonde", "Brown", "Blue", "Red", "Pink", "Purple", "Green", "White", "Gray"]} />
          <ChoiceGroup label="Eye colour" value={eyes} onChange={setEyes} values={["Black", "Brown", "Blue", "Green", "Red", "Purple", "Yellow", "Gray"]} />
          <ChoiceGroup label="Gender" value={gender} onChange={setGender} values={["Female", "Male", "Androgynous", "Ambiguous"]} />
          <ChoiceGroup label="Apparent age" value={age} onChange={setAge} values={["Child", "Teenager", "Adult", "Senior", "Ageless"]} />
          <ChoiceGroup label="Hair length" value={hairLength} onChange={setHairLength} values={["To ears", "To neck", "To shoulders", "To chest", "To waist", "Past hips", "Hair up"]} />
          <ChoiceGroup label="Ears or horns" value={ears} onChange={setEars} values={["No animal ears", "Elf", "Animal", "Horns"]} />
          <ChoiceGroup label="Story role" value={role} onChange={setRole} values={["Protagonist", "Antagonist", "Main", "Supporting"]} />
        </div>
        </section>
        <label><span>Distinctive details</span><textarea rows={4} value={traits} onChange={(event) => setTraits(event.target.value)} placeholder="Blindfold, school uniform, quiet personality, fire powers…" /></label>
        <button disabled={loading}><Sparkles size={17} />{loading ? "Matching…" : cluesButtonLabel(name, hair, eyes, traits)}</button>
      </form>
    </aside>
    <div className="discovery-output-panel" aria-live="polite" ref={outputRef}>
      <header><div><span>Catalogue results</span><h2>{resultLabel}</h2><p>{sourceNote}</p></div><b>{results.length} shown</b></header>
      {error && <div className="finder-error">{error}</div>}
      {loading ? <div className="discovery-result-skeleton"><i /><i /><i /><i /></div> : <div className="character-workbench-results">{results.map((character) => {
        const anime = character.media?.nodes?.[0];
        return <Link to={`/character/${character.id}`} key={character.id}><ProgressiveImage src={character.image?.large || character.image?.medium} alt={character.name?.full} wrapperClassName="character-workbench-image" className="h-full w-full object-cover" /><div><b className={character.__resultKind === "Related suggestion" ? "is-related" : ""}>{character.__resultKind || "Popular character"}</b><h3>{character.name?.full}</h3>{character.name?.native && <p>{character.name.native}</p>}<span>{anime?.title?.english || anime?.title?.romaji || "Anime unavailable"}</span><small>Artwork, voice cast and appearances</small></div><ArrowRight size={17} /></Link>;
      })}</div>}
    </div>
  </section>;
};

const cluesButtonLabel = (...values: string[]) => values.some((value) => value.trim()) ? "Find matching characters" : "Browse popular characters";

const CharacterFinder: React.FC = () => <div className="character-finder-page"><SEO title="Anime Character Finder" description="Find anime characters by appearance, personality or name." keywords="anime character finder, visual character search" url="https://animeorbit.web.app/discovery/characters" /><main className="character-finder-shell"><header className="character-finder-route-head"><Link to="/discovery?tool=characters"><ArrowLeft size={16} />Anime Discovery</Link><div><UserRound size={22} /><span>Shareable character search</span><h1>Character Finder</h1></div></header><CharacterFinderWorkspace /></main><Footer /></div>;

export default CharacterFinder;
