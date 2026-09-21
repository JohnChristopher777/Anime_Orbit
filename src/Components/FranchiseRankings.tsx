import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers3, RefreshCw, Star, Users } from "lucide-react";
import { getFranchiseGroups } from "../services/anilist";
import ProgressiveImage from "./ProgressiveImage";

export default function FranchiseRankings({ anime }: { anime: any[] }) {
  const [merged, setMerged] = React.useState(false);
  const [groups, setGroups] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!merged || groups.length || !anime.length) return;
    setLoading(true);
    getFranchiseGroups(anime.slice(0, 18).map((item) => item.mal_id))
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [merged, groups.length, anime]);

  const entries = merged ? groups.slice(0, 6) : anime.slice(0, 6);

  return (
    <section
      className="franchise-ranking"
      aria-labelledby="franchise-ranking-title"
    >
      <header>
        <div>
          <h2 id="franchise-ranking-title">Complete franchise rankings</h2>
          <p>
            See every connected season, sequel, movie, OVA, and source entry
            together.
          </p>
        </div>
        <div className="franchise-ranking__controls">
          <label className="franchise-merge-toggle">
            <input
              type="checkbox"
              checked={merged}
              onChange={(event) => setMerged(event.target.checked)}
            />
            <span className="franchise-merge-toggle__track" aria-hidden="true">
              <span />
            </span>
            <span>Merge related entries</span>
          </label>
          <Link to="/franchises">
            Browse all franchises <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="franchise-ranking__loading">
          <RefreshCw size={18} className="animate-spin" /> Building franchise
          groups…
        </div>
      ) : (
        <div className="franchise-ranking__grid">
          {entries.map((item, index) => (
            <Link to={`/franchise/${item.mal_id}`} key={item.mal_id}>
              <span className="franchise-ranking__position">#{index + 1}</span>
              <ProgressiveImage
                src={
                  item.images?.jpg?.large_image_url ||
                  item.images?.jpg?.image_url
                }
                alt=""
                wrapperClassName="franchise-ranking__cover"
                className="h-full w-full object-cover"
              />
              <div>
                <h3>{item.title_english || item.title}</h3>
                <p>
                  <span>
                    <Star size={11} fill="currentColor" /> {item.score || "N/A"}
                  </span>
                  {merged && (
                    <span>
                      <Layers3 size={11} /> {item.franchiseEntries} entries
                    </span>
                  )}
                  {Number(item.scored_by || item.popularity) > 0 && (
                    <span>
                      <Users size={11} />{" "}
                      {Number(
                        item.scored_by || item.popularity,
                      ).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
