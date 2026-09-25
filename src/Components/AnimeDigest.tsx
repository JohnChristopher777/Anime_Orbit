import React from "react";
import { AlertTriangle, Bell, CheckCheck, ExternalLink, Heart, Lightbulb, MessageSquareReply, Newspaper, Quote, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";

interface DigestData {
  quote: { content: string; anime: string; character: string; characterImage?: string; characterId?: number; source: string } | null;
  facts: Array<{ id: string; anime: string; content: string; image?: string; source: string }>;
  news: Array<{ title: string; url: string; summary: string; publishedAt: string; source: string }>;
  generatedAt?: string;
}

const AnimeDigest: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifications, unreadCount, loading: notificationsLoading, markRead, markAllRead } = useNotifications();
  const [notificationFilter, setNotificationFilter] = React.useState<"all" | "unread">("all");
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
          <div className="digest-hero__copy"><h1>Notifications & anime briefing</h1><p>Replies and reactions to your discussions, followed by industry headlines, quotes and fan notes.</p></div>
          <button type="button" onClick={() => void loadDigest(true)} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh briefing</button>
        </header>

        <section className="digest-notifications" aria-labelledby="digest-notifications-title">
          <header>
            <div><span><Bell size={15} /> Community activity</span><h2 id="digest-notifications-title">Your notifications</h2><p>Replies, likes and important activity from anime and manga discussions appear here.</p></div>
            {currentUser && <div className="digest-notifications__actions"><button type="button" className={notificationFilter === "all" ? "is-active" : ""} onClick={() => setNotificationFilter("all")}>All</button><button type="button" className={notificationFilter === "unread" ? "is-active" : ""} onClick={() => setNotificationFilter("unread")}>Unread {unreadCount > 0 && <b>{unreadCount}</b>}</button><button type="button" onClick={() => void markAllRead()} disabled={!unreadCount}><CheckCheck size={14} />Mark all read</button></div>}
          </header>
          {!currentUser ? <div className="digest-notifications__empty"><Bell size={24} /><div><strong>Sign in for community notifications</strong><p>Replies, likes and important discussion activity will remain synced to your account.</p></div><Link to="/profile">Sign in</Link></div> : notificationsLoading ? <div className="digest-notifications__loading"><span /><span /><span /></div> : (() => {
            const visible = notificationFilter === "unread" ? notifications.filter((item) => !item.read) : notifications;
            return visible.length ? <div className="digest-notifications__list">{visible.map((item) => {
              const target = item.mediaType === "MANGA"
                ? `/manga/${item.animeId}#comment-${item.parentId || item.commentId}`
                : `/anime/${item.animeId}?tab=discussion#comment-${item.parentId || item.commentId}`;
              const created = item.createdAt?.toDate?.();
              return <article key={item.id} className={item.read ? "" : "is-unread"}>
                {item.type === "controversial" ? <div className="digest-notifications__avatar is-warning"><AlertTriangle size={20} /></div> : <Link to={`/user/${item.actorId}`} className="digest-notifications__avatar" aria-label={`View ${item.actorName}'s profile`}>{item.actorAvatar ? <ProgressiveImage src={item.actorAvatar} alt="" wrapperClassName="h-full w-full" className="h-full w-full object-cover" /> : <span>{item.actorName?.[0]?.toUpperCase() || "A"}</span>}</Link>}
                <Link to={target} className="digest-notifications__content" onClick={() => void markRead(item.id)}><span>{item.type === "reply" ? <MessageSquareReply size={14} /> : item.type === "like" ? <Heart size={14} fill="currentColor" /> : <AlertTriangle size={14} />}{item.type === "reply" ? "New reply" : item.type === "like" ? "Comment liked" : "Discussion activity"}</span><p>{item.type === "controversial" ? <>Your comment might be controversial on <b>{item.animeTitle}</b>.</> : <><strong>{item.actorName}</strong>{item.type === "reply" ? " replied to your discussion" : " liked your comment"} on <b>{item.animeTitle}</b>.</>}</p>{item.preview && <blockquote>{item.preview}</blockquote>}<small>{created ? created.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Just now"}</small></Link>
                {!item.read && <button type="button" onClick={() => void markRead(item.id)} aria-label="Mark notification as read"><span /></button>}
              </article>;
            })}</div> : <div className="digest-notifications__empty"><CheckCheck size={24} /><div><strong>{notificationFilter === "unread" ? "You're all caught up" : "No community activity yet"}</strong><p>{notificationFilter === "unread" ? "There are no unread notifications." : "New replies and likes will appear here."}</p></div></div>;
          })()}
        </section>

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
