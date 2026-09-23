import React from "react";
import { Bell, ExternalLink, Lightbulb, Newspaper, Quote, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";

interface DigestData {
  quote: { content: string; anime: string; character: string; characterImage?: string; characterId?: number; source: string } | null;
  facts: Array<{ id: string; anime: string; content: string; image?: string; source: string }>;
  news: Array<{ title: string; url: string; summary: string; publishedAt: string; source: string }>;
  generatedAt?: string;
}

const AnimeDigest: React.FC = () => {
  const [digest, setDigest] = React.useState<DigestData>({ quote: null, facts: [], news: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadDigest = React.useCallback(async (refresh = false) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(refresh ? `/api/anime-digest?refresh=1&t=${Date.now()}` : "/api/anime-digest", { headers: { Accept: "application/json" }, cache: refresh ? "no-store" : "default" });
      if (!response.ok) throw new Error("Digest unavailable");
      const payload = await response.json();
      const next = {
        quote: payload?.quote || null,
        facts: Array.isArray(payload?.facts) ? payload.facts : [],
        news: Array.isArray(payload?.news) ? payload.news : [],
        generatedAt: payload?.generatedAt,
      };
      setDigest(next);
      if (!next.quote && !next.facts.length && !next.news.length) setError("Editorial sources are temporarily unavailable.");
    } catch {
      setError("The anime desk could not connect. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadDigest(); }, [loadDigest]);

  return (
    <div className="digest-page">
      <SEO title="Anime Digest - Quotes, Facts and Industry News" description="A focused anime news desk with current headlines, character quotes and researched fan facts." keywords="anime news, anime quotes, anime facts, anime digest" url="https://animeorbit.web.app/digest" />
      <main className="digest-shell">
        <header className="digest-hero">
          <div className="digest-hero__signal"><Bell size={18} /><span>Anime desk</span><i /></div>
          <div className="digest-hero__copy"><h1>Your anime briefing</h1><p>Industry headlines, a featured character quote, and fan notes gathered from dedicated anime sources.</p></div>
          <button type="button" onClick={() => void loadDigest(true)} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh briefing</button>
        </header>

        {error && <div className="digest-error">{error}</div>}
        {loading && !digest.news.length ? <div className="digest-loading"><span /><span /><span /></div> : (
          <div className="digest-layout">
            <div className="digest-main">
              <section className="digest-section digest-news" aria-labelledby="digest-news-title">
                <header><div><span><Newspaper size={15} /> Industry wire</span><h2 id="digest-news-title">Latest headlines</h2></div><small>{digest.generatedAt ? `Updated ${new Date(digest.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Updated recently"}</small></header>
                <div>{digest.news.map((story, index) => <a href={story.url} target="_blank" rel="noreferrer" key={`${story.url}-${index}`}><span className="digest-news__rank">{String(index + 1).padStart(2, "0")}</span><div><h3>{story.title}</h3>{story.summary && <p>{story.summary}</p>}<small>{story.source}{story.publishedAt ? ` · ${new Date(story.publishedAt).toLocaleDateString()}` : ""}</small></div><ExternalLink size={16} /></a>)}</div>
              </section>
            </div>

            <aside className="digest-side">
              {digest.quote && <article className="digest-quote">
                <div className="digest-quote__portrait">{digest.quote.characterImage ? <ProgressiveImage src={digest.quote.characterImage} alt={digest.quote.character} wrapperClassName="h-full w-full" className="h-full w-full object-cover" /> : <Quote size={30} />}</div>
                <div><span><Sparkles size={14} />Quote of the moment</span><blockquote>“{digest.quote.content}”</blockquote><p>{digest.quote.character}</p><small>{digest.quote.anime} · {digest.quote.source}</small>{digest.quote.characterId && <Link to={`/character/${digest.quote.characterId}`}>View character</Link>}</div>
              </article>}

              {digest.facts.length > 0 && <section className="digest-section digest-facts"><header><div><span><Lightbulb size={15} /> Fan notebook</span><h2>Facts worth knowing</h2></div></header><div>{digest.facts.map((fact) => <article key={fact.id}>{fact.image && <ProgressiveImage src={fact.image} alt="" wrapperClassName="digest-facts__image" className="h-full w-full object-cover" />}<div><strong>{fact.anime}</strong><p>{fact.content}</p><small>{fact.source}</small></div></article>)}</div></section>}
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AnimeDigest;
