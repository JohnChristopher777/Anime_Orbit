import React from "react";
import { ArrowLeft, Calendar, ListTodo, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { decodeSharedList } from "../utils/sharedList";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";
import SharedOwnerCard from "./SharedOwnerCard";

const scoreLabel = (value: number | null) =>
  value ? value.toFixed(2).replace(/\.00$/, ".0") : "Not rated";

const SharedWatchlist: React.FC = () => {
  const payload = React.useMemo(
    () => decodeSharedList(window.location.hash.replace(/^#/, "")),
    [],
  );
  const isManga = payload?.mediaType === "manga";

  return (
    <div className="min-h-screen flex flex-col text-white">
      <SEO
        title={`Shared ${isManga ? "Manga Reading List" : "Anime Watchlist"}`}
        description={`A privacy-safe ${isManga ? "manga reading list" : "anime watchlist"} shared from Anime Orbit.`}
        url="https://animeorbit.web.app/shared-list"
        noIndex
      />
      <main className="shared-list-page flex-1">
        <nav className="shared-page-toolbar" aria-label="Shared list navigation">
          <Link to="/watchlist">
            <ArrowLeft size={18} /> Back to My Watchlist
          </Link>
          <span>View-only shared page</span>
        </nav>
        <header className="shared-list-hero">
          <div>
            <h1>
              {isManga ? "Shared manga reading list" : "Shared anime watchlist"}
            </h1>
          </div>
          {payload && <b>{payload.items.length} titles</b>}
        </header>

        {payload && <SharedOwnerCard owner={payload.owner} />}

        {!payload ? (
          <section className="shared-list-empty">
            <ListTodo size={34} />
            <h2>This shared list is unavailable</h2>
            <p>The link may be incomplete, invalid or from an older format.</p>
            <Link to="/watchlist">Open Watchlist</Link>
          </section>
        ) : (
          <>
            <section className="shared-list-summary">
              <div>
                <Calendar size={16} />
                <span>
                  Shared{" "}
                  {payload.createdAt
                    ? new Date(payload.createdAt).toLocaleDateString()
                    : "recently"}
                </span>
              </div>
              <p>
                Ordered by status: Completed, {isManga ? "Reading" : "Watching"}
                , then {isManga ? "Plan to Read" : "Plan to Watch"}; by oldest
                entries.
              </p>
            </section>
            <section className="shared-list-grid" aria-label="Shared titles">
              {payload.items.map((item, index) => (
                <article
                  key={`${item.id}-${index}`}
                  data-status={item.status.toLowerCase().replace(/\s+/g, "-")}
                >
                  <Link
                    to={`/${isManga ? "manga" : "anime"}/${item.id}`}
                    className="shared-list-cover-link"
                  >
                    <ProgressiveImage
                      src={item.image}
                      alt={item.title}
                      wrapperClassName="shared-list-cover"
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="shared-list-copy">
                    <span>{item.status}</span>
                    <h2>
                      <Link to={`/${isManga ? "manga" : "anime"}/${item.id}`}>
                        {item.title}
                      </Link>
                    </h2>
                    <p>
                      {item.format}
                      {item.total
                        ? ` · ${item.progress}/${item.total} ${isManga ? "chapters" : "episodes"}`
                        : item.progress
                          ? ` · ${item.progress} completed`
                          : ""}
                    </p>
                    <div className="shared-list-scores">
                      <b>
                        <Star size={13} fill="currentColor" /> Your score{" "}
                        {scoreLabel(item.userScore)}
                      </b>
                      {item.catalogueScore && (
                        <small>
                          Catalogue {scoreLabel(item.catalogueScore)}
                        </small>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SharedWatchlist;
