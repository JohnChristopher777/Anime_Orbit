import React from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { BarChart3, Check, Clock3, Users } from "lucide-react";
import { toast } from "react-toastify";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { getSeasonalAnime } from "../services/anilist";
import ProgressiveImage from "./ProgressiveImage";

const getWeekNumber = (date: Date) =>
  Math.ceil(
    (Number(date) - Number(new Date(date.getFullYear(), 0, 1))) / 604800000,
  );

const getDeadline = () => {
  const deadline = new Date();
  const daysUntilSunday = (7 - deadline.getDay()) % 7;
  deadline.setDate(deadline.getDate() + daysUntilSunday);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
};

export default function SeasonPolls() {
  const { currentUser } = useAuth();
  const year = new Date().getFullYear();
  const pollId = `fall-${year}-week-${getWeekNumber(new Date())}`;
  const deadline = React.useMemo(getDeadline, []);
  const [anime, setAnime] = React.useState<any[]>([]);
  const [votes, setVotes] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [votingId, setVotingId] = React.useState<number | null>(null);
  const voterKey = currentUser?.uid || "";
  const localVoteKey = `anime-orbit-poll-choice-${pollId}`;
  const [localVote, setLocalVote] = React.useState<number | undefined>(() => {
    const saved = Number(localStorage.getItem(localVoteKey));
    return Number.isFinite(saved) && saved > 0 ? saved : undefined;
  });
  const closed = Date.now() > deadline.getTime();

  React.useEffect(() => {
    let current = true;
    getSeasonalAnime("FALL", year, 8)
      .then((items: any[]) => {
        if (current) setAnime(items || []);
      })
      .catch(() => {
        if (current) setAnime([]);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [year]);

  React.useEffect(
    () =>
      onSnapshot(
        collection(db, "seasonPolls", pollId, "votes"),
        (snapshot) => {
          const next: Record<string, number> = {};
          snapshot.docs.forEach((vote) => {
            next[vote.id] = Number(vote.data().animeId);
          });
          setVotes(next);
        },
        () => undefined,
      ),
    [pollId],
  );

  const totals = React.useMemo(
    () =>
      Object.values(votes).reduce<Record<number, number>>((result, animeId) => {
        result[animeId] = (result[animeId] || 0) + 1;
        return result;
      }, {}),
    [votes],
  );
  const totalVotes = Object.keys(votes).length;
  const myVote = votes[voterKey] ?? localVote;
  const revealResults = myVote !== undefined;

  const vote = async (animeId: number) => {
    if (closed) return;
    if (!currentUser || !voterKey) {
      toast.info("Sign in to cast a verified weekly vote.");
      return;
    }
    setVotingId(animeId);
    setLocalVote(animeId);
    localStorage.setItem(localVoteKey, String(animeId));
    setVotes((current) => ({ ...current, [voterKey]: animeId }));
    try {
      await setDoc(doc(db, "seasonPolls", pollId, "votes", voterKey), {
        animeId,
        voterKey,
        updatedAt: serverTimestamp(),
      });
    } catch {
      toast.info(
        "Vote saved on this device. Global sync will retry when available.",
      );
    } finally {
      setVotingId(null);
    }
  };

  return (
    <section className="season-poll" aria-labelledby="fall-poll-title">
      <header className="season-poll__header">
        <div>
          <h2 id="fall-poll-title">Vote Now - Which Fall anime owns this week?</h2>
          <p>
            Select one cover to cast your vote. The live results appear after
            your pick.
          </p>
        </div>
        <div className="season-poll__meta">
          <span>
            <Users size={14} /> {totalVotes} votes
          </span>
          <span>
            <Clock3 size={14} />{" "}
            {closed ? "Voting closed" : "Closes Sunday, 11:59 PM"}
          </span>
        </div>
      </header>

      <div className="season-poll__options">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="season-poll__skeleton" />
          ))
        ) : anime.length === 0 ? (
          <div className="season-poll__empty">
            This week’s Fall lineup is unavailable. Check back shortly.
          </div>
        ) : (
          anime.map((item, index) => {
            const count = totals[item.mal_id] || 0;
            const percentage = totalVotes
              ? Math.round((count / totalVotes) * 100)
              : 0;
            const selected = myVote === item.mal_id;
            return (
              <button
                type="button"
                key={item.mal_id}
                onClick={() => vote(item.mal_id)}
                disabled={votingId !== null || closed}
                className={`${selected ? "is-selected" : ""} ${index % 2 ? "is-cut-right" : "is-cut-left"}`}
              >
                {revealResults && (
                  <span
                    className="season-poll__fill"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <ProgressiveImage
                  src={
                    item.images?.jpg?.image_url ||
                    item.images?.jpg?.large_image_url
                  }
                  alt=""
                  wrapperClassName="season-poll__cover"
                  className="h-full w-full object-cover"
                />
                <span className="season-poll__title">
                  <strong>{item.title_english || item.title}</strong>
                  <small>
                    {item.type || "TV"}
                    {item.episodes ? ` · ${item.episodes} episodes` : ""}
                  </small>
                </span>
                <span
                  className={`season-poll__result ${revealResults ? "is-visible" : ""}`}
                >
                  {revealResults ? (
                    <>
                      {selected && <Check size={13} />}
                      {percentage}%<small>{count} votes</small>
                    </>
                  ) : (
                    <small>Choose</small>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
