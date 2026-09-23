import React from "react";
import { ArrowRight, Languages, Mic2, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getCharacterVoiceRoles,
  getPopularCharacters,
  getPopularVoiceActors,
  searchCharacters,
  searchVoiceActors,
} from "../services/anilist";
import ProgressiveImage from "./ProgressiveImage";

type CastMode = "character" | "actor";
type VoiceLanguage = "Japanese" | "English";

const VoiceCastExplorer: React.FC = () => {
  const [mode, setMode] = React.useState<CastMode>("actor");
  const [language, setLanguage] = React.useState<VoiceLanguage>("Japanese");
  const [query, setQuery] = React.useState("");
  const [characters, setCharacters] = React.useState<any[]>([]);
  const [actors, setActors] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const outputRef = React.useRef<HTMLDivElement | null>(null);

  const runSearch = React.useCallback(async (nextMode: CastMode, rawQuery = "", nextLanguage: VoiceLanguage = "Japanese") => {
    setLoading(true);
    setError("");
    try {
      if (nextMode === "character") {
        const rows = rawQuery.trim() ? await searchCharacters(rawQuery.trim(), 12) : await getPopularCharacters(12);
        setCharacters(rows);
        if (!rawQuery.trim()) {
          setActors([]);
          if (!rows.length) setError("No character suggestions were available. Try entering a character name.");
        } else {
          const roleResults = await Promise.allSettled(rows.slice(0, 6).map(async (character: any) => ({
            character,
            roles: await getCharacterVoiceRoles(character.id, 20, nextLanguage.toUpperCase()),
          })));
          const actorRows = roleResults.flatMap((result) => {
            if (result.status !== "fulfilled") return [];
            const { character, roles } = result.value;
            return (roles?.media?.edges || []).flatMap((edge: any) =>
              (edge.voiceActorRoles || []).map((role: any) => ({
                ...role.voiceActor,
                matchedCharacter: character,
                latestMedia: edge.node,
              })),
            );
          });
          const uniqueActors = [...new Map(actorRows.filter((actor: any) => actor?.id).map((actor: any) => [actor.id, actor])).values()];
          setActors(uniqueActors);
          if (!uniqueActors.length) setError(`No ${nextLanguage.toLowerCase()} voice actors were found for that character.`);
        }
      } else {
        const rows = rawQuery.trim()
          ? await searchVoiceActors(rawQuery.trim(), 16, nextLanguage)
          : await getPopularVoiceActors(16, nextLanguage);
        setActors(rows);
        setCharacters([]);
        if (!rows.length) setError(`No ${nextLanguage.toLowerCase()} voice actor matches were available. Try part of the name.`);
      }
    } catch {
      setError("The voice-cast catalogue could not be reached. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void runSearch("actor", "", "Japanese");
  }, [runSearch]);

  React.useEffect(() => {
    const refresh = () => void runSearch(mode, query, language);
    window.addEventListener("orbit_mature_content_changed", refresh);
    return () => window.removeEventListener("orbit_mature_content_changed", refresh);
  }, [language, mode, query, runSearch]);

  const switchMode = (nextMode: CastMode) => {
    setMode(nextMode);
    setQuery("");
    void runSearch(nextMode, "", language);
  };

  const switchLanguage = (nextLanguage: VoiceLanguage) => {
    setLanguage(nextLanguage);
    void runSearch(mode, query, nextLanguage);
  };

  const submitSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    await runSearch(mode, query, language);
    if (window.matchMedia("(max-width: 920px)").matches) outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showingResolvedActors = mode === "actor" || Boolean(query.trim());
  const resultCount = showingResolvedActors ? actors.length : characters.length;

  return (
    <section className="discovery-workbench discovery-workbench--cast">
      <aside className="discovery-input-panel">
        <span className="discovery-panel-kicker">Voice cast explorer</span>
        <h2>Follow a voice across anime</h2>
        <p>Search a character name to get their voice actors and complete actor details, or search an actor to browse every available role.</p>

        <div className="cast-language-switch" role="group" aria-label="Voice language">
          {(["Japanese", "English"] as VoiceLanguage[]).map((option) => (
            <button type="button" key={option} className={language === option ? "is-active" : ""} onClick={() => switchLanguage(option)} aria-pressed={language === option}>
              <Languages size={15} /> {option}
            </button>
          ))}
        </div>

        <div className="cast-mode-switch" role="group" aria-label="Cast search direction">
          <button type="button" className={mode === "character" ? "is-active" : ""} onClick={() => switchMode("character")}><UserRound size={16} />Character name</button>
          <button type="button" className={mode === "actor" ? "is-active" : ""} onClick={() => switchMode("actor")}><Mic2 size={16} />Voice actor</button>
        </div>

        <form className="discovery-side-search" onSubmit={submitSearch}>
          <label htmlFor="cast-search">{mode === "character" ? "Character name" : "Voice actor name"}</label>
          <div><Search size={17} /><input id="cast-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === "character" ? "Luffy, Gojo, Frieren…" : "Mayumi Tanaka, Mamoru Miyano…"} /></div>
          <button disabled={loading}>{loading ? "Checking cast…" : query.trim() ? "Search cast" : "Browse popular"}</button>
        </form>

        <div className="discovery-provider-note"><Languages size={16} /><span>{mode === "character" ? `Enter a character name to see their ${language.toLowerCase()} actors directly.` : `Showing ${language.toLowerCase()} performers and their recent roles.`}</span></div>
      </aside>

      <div className="discovery-output-panel" aria-live="polite" ref={outputRef}>
        <header><div><span>{mode === "character" ? "Character to actor" : "Actor to characters"}</span><h2>{query.trim() ? `Matches for “${query.trim()}”` : mode === "character" ? "Choose a popular character" : `Popular ${language} voice actors`}</h2></div><b>{resultCount} results</b></header>
        {error && <div className="finder-error">{error}</div>}
        {loading ? <div className="discovery-result-skeleton"><i /><i /><i /><i /></div> : showingResolvedActors ? (
          <div className="cast-result-grid">
            {actors.map((actor) => {
              const recent = actor.latestMedia || actor.characterMedia?.edges?.[0]?.node;
              const character = actor.matchedCharacter || actor.characterMedia?.edges?.[0]?.characters?.[0];
              return <Link to={`/voice-actor/${actor.id}`} key={actor.id} className="cast-person-card">
                <ProgressiveImage src={actor.image?.large || actor.image?.medium} alt={actor.name?.full} wrapperClassName="cast-person-card__image" className="h-full w-full object-cover" />
                <div><span>{actor.languageV2 || language} voice actor</span><h3>{actor.name?.full}</h3><p>{character?.name?.full ? `${character.name.full} · ${recent?.title?.english || recent?.title?.romaji || "Anime role"}` : "Open complete role history"}</p></div><ArrowRight size={17} />
              </Link>;
            })}
          </div>
        ) : (
          <div className="cast-result-grid">
            {characters.map((character) => {
              const anime = character.media?.nodes?.[0];
              return <button type="button" key={character.id} className="cast-person-card" onClick={() => { setQuery(character.name?.full || ""); void runSearch("character", character.name?.full || "", language); }}>
                <ProgressiveImage src={character.image?.large || character.image?.medium} alt={character.name?.full} wrapperClassName="cast-person-card__image" className="h-full w-full object-cover" />
                <div><span>{anime?.title?.english || anime?.title?.romaji || "Character"}</span><h3>{character.name?.full}</h3><p>Find {language.toLowerCase()} voice actors</p></div><ArrowRight size={17} />
              </button>;
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default VoiceCastExplorer;
