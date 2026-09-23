import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ExternalLink,
  Languages,
  Mic2,
  Share2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getVoiceActorDetails } from "../services/anilist";
import AppDropdown from "./AppDropdown";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";

const plainText = (value: string) =>
  String(value || "")
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\*\*|__|~~/g, "")
    .replace(/\s+/g, " ")
    .trim();

const extractLinks = (value: string) =>
  [...String(value || "").matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)]
    .map((match) => ({ label: match[1], url: match[2] }))
    .filter(
      (link, index, links) =>
        links.findIndex((candidate) => candidate.url === link.url) === index,
    )
    .slice(0, 5);

const VoiceActorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [actor, setActor] = React.useState<any>(null);
  const [roles, setRoles] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [roleSort, setRoleSort] = React.useState("newest");

  const load = React.useCallback(
    async (nextPage: number, replace = false) => {
      if (!id) return;
      setLoading(true);
      setLoadError("");
      try {
        const data = await getVoiceActorDetails(id, nextPage, 25);
        if (!data) throw new Error("Actor not found");
        setActor(data);
        setHasMore(Boolean(data.characterMedia?.pageInfo?.hasNextPage));
        setPage(nextPage);
        setRoles((current) => {
          const incoming = data.characterMedia?.edges || [];
          const merged = replace ? incoming : [...current, ...incoming];
          return [
            ...new Map(
              merged.map((edge: any) => [
                `${edge.node?.id}:${edge.characters
                  ?.map((character: any) => character.id)
                  .join(",")}`,
                edge,
              ]),
            ).values(),
          ];
        });
      } catch {
        setLoadError("Voice roles could not be loaded. Try again shortly.");
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  React.useEffect(() => {
    setRoles([]);
    void load(1, true);
    const refresh = () => {
      setRoles([]);
      void load(1, true);
    };
    window.addEventListener("orbit_mature_content_changed", refresh);
    return () => window.removeEventListener("orbit_mature_content_changed", refresh);
  }, [load]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share)
        await navigator.share({ title: actor?.name?.full || "Voice actor", url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // Closing the native share sheet is not an error.
    }
  };

  const roleRows = React.useMemo(
    () =>
      roles.flatMap((edge: any) =>
        (edge.characters || []).map((character: any) => ({ edge, character })),
      ),
    [roles],
  );
  const sortedRows = React.useMemo(() => {
    const copy = [...roleRows];
    if (roleSort === "oldest")
      return copy.sort(
        (left, right) =>
          Number(left.edge.node?.startDate?.year || 9999) -
          Number(right.edge.node?.startDate?.year || 9999),
      );
    if (roleSort === "character")
      return copy.sort((left, right) =>
        String(left.character?.name?.full || "").localeCompare(
          String(right.character?.name?.full || ""),
        ),
      );
    return copy.sort(
      (left, right) =>
        Number(right.edge.node?.startDate?.year || 0) -
        Number(left.edge.node?.startDate?.year || 0),
    );
  }, [roleRows, roleSort]);
  const profileLinks = React.useMemo(
    () => extractLinks(actor?.description || ""),
    [actor?.description],
  );

  return (
    <div className="voice-detail-page">
      <SEO
        title={`${actor?.name?.full || "Voice Actor"} - Voice Roles`}
        description={`Characters and anime voiced by ${actor?.name?.full || "this actor"}, ordered by year.`}
        keywords="anime voice actor, seiyuu, anime cast"
        url={`https://animeorbit.web.app/voice-actor/${id}`}
        image={actor?.image?.large}
      />
      <main className="voice-detail-shell">
        <div className="voice-detail-actions">
          <button
            type="button"
            onClick={() =>
              window.history.length > 2
                ? navigate(-1)
                : navigate("/discovery?tool=voices")
            }
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button type="button" onClick={share} disabled={!actor}>
            <Share2 size={16} /> Share page
          </button>
        </div>

        {loading && !actor ? (
          <section
            className="voice-detail-hero voice-detail-hero--loading"
            aria-label="Loading voice actor"
          >
            <span className="voice-detail-skeleton voice-detail-skeleton--portrait" />
            <div>
              <span className="voice-detail-skeleton is-short" />
              <span className="voice-detail-skeleton is-title" />
              <span className="voice-detail-skeleton is-medium" />
              <span className="voice-detail-skeleton is-line" />
              <span className="voice-detail-skeleton is-line" />
            </div>
          </section>
        ) : loadError && !actor ? (
          <section className="voice-detail-missing" role="alert">
            <Mic2 size={24} />
            <div>
              <h1>Voice actor unavailable</h1>
              <p>{loadError}</p>
            </div>
          </section>
        ) : (
          <header className="voice-detail-hero">
            <ProgressiveImage
              src={actor?.image?.large || actor?.image?.medium}
              alt={actor?.name?.full || "Voice actor"}
              wrapperClassName="voice-detail-portrait"
              className="h-full w-full object-cover"
            />
            <div>
              <span>
                <Mic2 size={14} /> Voice actor
              </span>
              <h1>{actor?.name?.full || "Voice actor"}</h1>
              {actor?.name?.native && <h2>{actor.name.native}</h2>}
              <div className="voice-detail-meta">
                {actor?.languageV2 && (
                  <b>
                    <Languages size={14} /> {actor.languageV2}
                  </b>
                )}
                {actor?.yearsActive?.[0] && (
                  <b>
                    <Calendar size={14} /> Active since {actor.yearsActive[0]}
                  </b>
                )}
                <b>{roleRows.length} loaded roles</b>
              </div>
              {actor?.description && (
                <p>{plainText(actor.description).slice(0, 420)}</p>
              )}
              {(actor?.siteUrl || profileLinks.length > 0) && (
                <div className="voice-profile-links">
                  {actor?.siteUrl && (
                    <a href={actor.siteUrl} target="_blank" rel="noreferrer">
                      Full profile <ExternalLink size={12} />
                    </a>
                  )}
                  {profileLinks.map((link) => (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      key={link.url}
                    >
                      {link.label} <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </header>
        )}

        <section className="voice-role-section">
          <header>
            <div>
              <span>Role timeline</span>
              <h2>Voiced characters</h2>
              <p>Open a character or jump directly to the named anime series.</p>
            </div>
            <label>
              <span>Sort roles</span>
              <AppDropdown
                ariaLabel="Sort voice acting roles"
                value={roleSort}
                onChange={setRoleSort}
                options={[
                  { value: "newest", label: "Newest year" },
                  { value: "oldest", label: "Oldest year" },
                  { value: "character", label: "Character A-Z" },
                ]}
              />
            </label>
          </header>
          {loadError && <div className="finder-error">{loadError}</div>}
          {loading && !roleRows.length ? (
            <div className="voice-role-skeleton" aria-label="Loading voice roles">
              {Array.from({ length: 6 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
          ) : (
            <div className="voice-role-list">
              {sortedRows.map(({ edge, character }) => {
                const animeTitle =
                  edge.node?.title?.english ||
                  edge.node?.title?.romaji ||
                  "Open anime";
                return (
                  <article key={`${edge.node?.id}-${character.id}`}>
                    <ProgressiveImage
                      src={character.image?.large || character.image?.medium}
                      alt={character.name?.full}
                      wrapperClassName="voice-role-character"
                      className="h-full w-full object-cover"
                    />
                    <div className="voice-role-copy">
                      <span>
                        {edge.node?.startDate?.year || "Year unknown"} ·{" "}
                        {edge.characterRole || "Role"}
                      </span>
                      <h3>{character.name?.full}</h3>
                      {character.name?.native && <p>{character.name.native}</p>}
                    </div>
                    <div className="voice-role-actions">
                      <Link to={`/character/${character.id}`}>
                        View character <ArrowRight size={14} />
                      </Link>
                      <Link to={`/anime/${edge.node?.id}`} className="is-anime">
                        <span>From: </span>{animeTitle} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {!loading && !roleRows.length && !loadError && (
            <div className="finder-empty">
              No roles allowed by the current mature-content preference were returned.
            </div>
          )}
          {hasMore && (
            <button
              className="voice-load-more"
              type="button"
              onClick={() => void load(page + 1)}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load older roles"}
            </button>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default VoiceActorDetails;
