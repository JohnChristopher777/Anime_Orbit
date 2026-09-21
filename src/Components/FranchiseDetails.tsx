import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  Film,
  Layers3,
  Play,
  Star,
  Users,
} from "lucide-react";
import { getFranchiseDetails } from "../services/anilist";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";
import Footer from "./Footer";

const displayDate = (date: any) => {
  if (!date?.year) return "Date not announced";
  return new Date(
    date.year,
    Math.max(0, Number(date.month || 1) - 1),
    Number(date.day || 1),
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: date.day ? "numeric" : undefined,
  });
};

export default function FranchiseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [timelineFilter, setTimelineFilter] = React.useState("all");

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    getFranchiseDetails(id)
      .then((result: any) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading)
    return (
      <div className="franchise-detail-skeleton">
        <span />
        <span />
        <span />
      </div>
    );
  if (!data)
    return (
      <div className="franchise-detail-empty">
        <Layers3 size={44} />
        <h1>Franchise unavailable</h1>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );

  const formatGroup = (entry: any) => {
    const format = String(entry.format || "").toUpperCase();
    if (format === "NOVEL") return "novel";
    if (format === "MOVIE") return "movie";
    if (["SPECIAL", "OVA", "ONA", "TV_SHORT", "MUSIC"].includes(format))
      return "special";
    return entry.mediaType === "MANGA" ? "manga" : "anime";
  };
  const filters = [
    { id: "all", label: "All releases" },
    { id: "anime", label: "Anime seasons" },
    { id: "manga", label: "Manga" },
    { id: "novel", label: "Novels" },
    { id: "special", label: "Specials & OVAs" },
    { id: "movie", label: "Movies" },
  ].map((filter) => ({
    ...filter,
    count:
      filter.id === "all"
        ? data.entries.length
        : data.entries.filter((entry: any) => formatGroup(entry) === filter.id)
            .length,
  }));
  const filteredEntries =
    timelineFilter === "all"
      ? data.entries
      : data.entries.filter(
          (entry: any) => formatGroup(entry) === timelineFilter,
        );

  return (
    <div className="min-h-screen bg-transparent text-white">
      <SEO
        title={`${data.title} Franchise Guide | Anime Orbit`}
        description={`Release-order walkthrough and combined details for the ${data.title} franchise.`}
        keywords={`${data.title}, watch order, franchise guide`}
        url={`https://animeorbit.web.app/franchise/${id}`}
        image={data.banner}
      />
      <main className="franchise-detail">
        <button className="franchise-detail__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>
        <header className="franchise-detail__hero">
          <ProgressiveImage
            src={data.banner}
            alt=""
            wrapperClassName="absolute inset-0"
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="franchise-detail__shade" />
          <div className="franchise-detail__hero-body">
            <ProgressiveImage
              src={data.root?.image}
              alt=""
              wrapperClassName="franchise-detail__poster"
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div>
              <span>
                <Layers3 size={14} /> Complete franchise
              </span>
              <h1>{data.title}</h1>
              <p>
                {data.entries.length} connected releases in chronological order.
              </p>
              <div className="franchise-detail__hero-tags">
                <span>{data.root?.format || "Series"}</span>
                <span>{data.firstRelease?.year || "Release pending"}</span>
                <span>{data.root?.status || "Status pending"}</span>
              </div>
            </div>
          </div>
        </header>

        <section
          className="franchise-detail__stats"
          aria-label="Combined franchise details"
        >
          <div>
            <Star size={16} />
            <span>
              Combined score<strong>{data.combinedScore || "N/A"}</strong>
            </span>
          </div>
          <div>
            <Users size={16} />
            <span>
              Total audience
              <strong>{Number(data.totalPopularity).toLocaleString()}</strong>
            </span>
          </div>
          <div>
            <Play size={16} />
            <span>
              Anime episodes<strong>{data.totalEpisodes || "—"}</strong>
            </span>
          </div>
          <div>
            <BookOpen size={16} />
            <span>
              Manga chapters<strong>{data.totalChapters || "—"}</strong>
            </span>
          </div>
          <div>
            <Clock3 size={16} />
            <span>
              Approx. watch time
              <strong>
                {data.watchMinutes
                  ? `${Math.round(data.watchMinutes / 60)} hours`
                  : "—"}
              </strong>
            </span>
          </div>
        </section>

        <section
          className="franchise-timeline"
          aria-labelledby="franchise-timeline-title"
        >
          <div className="franchise-timeline__heading">
            <span>Release walkthrough</span>
            <h2 id="franchise-timeline-title">
              Where to start and what comes next
            </h2>
            <p>
              This order follows the first release date. Adaptations and source
              manga are labelled separately.
            </p>
          </div>
          <div
            className="franchise-timeline__filters"
            role="group"
            aria-label="Filter franchise releases"
          >
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={timelineFilter === filter.id ? "is-active" : ""}
                onClick={() => setTimelineFilter(filter.id)}
                disabled={filter.count === 0}
              >
                <span>{filter.label}</span>
                <small>{filter.count}</small>
              </button>
            ))}
          </div>
          <div className="franchise-timeline__list">
            {filteredEntries.map((entry: any, index: number) => (
              <article key={entry.mal_id}>
                <span className="franchise-timeline__step">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <ProgressiveImage
                  src={entry.image}
                  alt=""
                  wrapperClassName="franchise-timeline__cover"
                  className="h-full w-full object-cover"
                />
                <div className="franchise-timeline__copy">
                  <span>
                    {entry.mediaType === "MANGA" ? (
                      <BookOpen size={12} />
                    ) : (
                      <Film size={12} />
                    )}
                    {entry.format || entry.mediaType}
                  </span>
                  <h3>{entry.title}</h3>
                  <p>
                    {entry.synopsis ||
                      "No synopsis has been supplied for this entry."}
                  </p>
                  <div>
                    <span>
                      <CalendarDays size={12} />
                      {displayDate(entry.startDate)}
                    </span>
                    {entry.score && (
                      <span>
                        <Star size={12} fill="currentColor" />
                        {entry.score}
                      </span>
                    )}
                    {entry.episodes && <span>{entry.episodes} episodes</span>}
                    {entry.chapters && <span>{entry.chapters} chapters</span>}
                  </div>
                </div>
                <Link
                  to={
                    entry.mediaType === "MANGA"
                      ? `/manga/${entry.mal_id}`
                      : `/anime/${entry.mal_id}`
                  }
                >
                  {entry.mediaType === "MANGA"
                    ? "Manga details"
                    : "Anime details"}
                </Link>
              </article>
            ))}
            {filteredEntries.length === 0 && (
              <div className="franchise-timeline__empty">
                No releases in this category.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
