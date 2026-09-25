import React from "react";
import { ArrowLeft, Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { decodeSharedFavourites, type SharedFavouriteItem } from "../utils/sharedFavourites";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";
import SharedOwnerCard from "./SharedOwnerCard";

const scoreLabel = (value: number | null) =>
  value ? value.toFixed(2).replace(/\.00$/, ".0") : "Not rated";

const SharedCard: React.FC<{ item: SharedFavouriteItem; isManga: boolean }> = ({ item, isManga }) => (
  <Link
    to={`/${isManga ? "manga" : "anime"}/${item.id}`}
    className="shared-favourite-card"
    aria-label={`Open ${item.title} details`}
  >
    <ProgressiveImage src={item.image} fallbackSrc="/lost.jpg" alt={item.title} wrapperClassName="shared-favourite-cover" className="h-full w-full object-cover" />
    <span className="shared-favourite-rank">{item.rank ? `#${item.rank}` : "Waiting"}</span>
    <div className="shared-favourite-details">
      <small>{item.format}</small>
      <strong>{item.title}</strong>
      <p><b><Star size={13} fill="currentColor" /> Your score {scoreLabel(item.userScore)}</b></p>
      {item.catalogueScore && <p>Catalogue score {scoreLabel(item.catalogueScore)}</p>}
      <em>Open series details →</em>
    </div>
  </Link>
);

const SharedFavourites: React.FC = () => {
  const payload = React.useMemo(() => decodeSharedFavourites(window.location.hash.replace(/^#/, "")), []);
  const isManga = payload?.mediaType === "manga";
  const itemMap = React.useMemo(() => new Map((payload?.items || []).map((item) => [item.id, item])), [payload]);

  return (
    <div className="min-h-screen flex flex-col text-white">
      <SEO title={`Shared ${isManga ? "Manga" : "Anime"} Favourites Tier List`} description={`A privacy-safe ${isManga ? "manga" : "anime"} favourites tier list shared from Anime Orbit.`} url="https://animeorbit.web.app/shared-favourites" noIndex />
      <main className="shared-favourites-page flex-1">
        <nav className="shared-page-toolbar" aria-label="Shared tier-list navigation">
          <Link to="/favourites"><ArrowLeft size={18} /> Back to My Favourites</Link>
          <span>Tap a cover to open its series page</span>
        </nav>

        <header className="shared-list-hero shared-favourites-hero">
          <div>
            <span>Community tier board</span>
            <h1>Shared {isManga ? "manga" : "anime"} favourites</h1>
            <p>A full-size copy of the sender's tier arrangement. Hover or focus a cover for scores and details; tap it to open the title.</p>
          </div>
          {payload && <b>{payload.items.length} favourites</b>}
        </header>

        {payload && <SharedOwnerCard owner={payload.owner} />}

        {!payload ? (
          <section className="shared-list-empty">
            <Heart size={38} />
            <h2>This shared tier list is unavailable</h2>
            <p>The link may be incomplete, invalid or from an older format.</p>
            <Link to="/favourites">Open Favourites</Link>
          </section>
        ) : (
          <section className="shared-tier-board" aria-label="Shared favourites tier list">
            {payload.tiers.map((tier) => {
              const items = tier.itemIds.map((id) => itemMap.get(id)).filter(Boolean) as SharedFavouriteItem[];
              return (
                <article className="shared-tier-row" key={tier.id}>
                  <h2 style={{ backgroundColor: tier.color, color: tier.textColor }}>{tier.name}</h2>
                  <div>
                    {items.map((item) => <SharedCard key={item.id} item={item} isManga={isManga} />)}
                    {items.length === 0 && <small>No favourites placed in this tier.</small>}
                  </div>
                </article>
              );
            })}
            {payload.waitingItemIds.length > 0 && (
              <article className="shared-tier-row shared-tier-waiting">
                <h2>Waiting</h2>
                <div>
                  {payload.waitingItemIds.map((id) => itemMap.get(id)).filter(Boolean).map((item) => <SharedCard key={item!.id} item={item!} isManga={isManga} />)}
                </div>
              </article>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SharedFavourites;
