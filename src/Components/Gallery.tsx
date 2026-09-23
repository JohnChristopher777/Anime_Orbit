import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, ChevronLeft, ChevronRight, Image as ImageIcon, Mic2, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useGlobalContext } from "../context/global";
import { getCharacterDetails, getCharacterVoiceRoles } from "../services/anilist";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";

export const Gallery: React.FC = () => {
  const { getAnimePictures, pictures, loading } = useGlobalContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [characterName, setCharacterName] = useState("Character");
  const [index, setIndex] = useState(0);
  const [optimizedPictures, setOptimizedPictures] = useState<any[]>([]);
  const [voiceRoles, setVoiceRoles] = useState<any[]>([]);
  const [voiceLanguage, setVoiceLanguage] = useState<"JAPANESE" | "ENGLISH">("JAPANESE");

  useEffect(() => {
    let current = true;
    if (!id) return;
    setIndex(0);
    setOptimizedPictures([]);
    Promise.allSettled([getCharacterDetails(id)]).then(([details]) => {
      if (!current) return;
      if (details.status === "fulfilled") setCharacterName(details.value?.name?.full || "Unknown character");
      else setCharacterName("Character");
    });
    void getAnimePictures(id);
    return () => { current = false; };
  }, [id, getAnimePictures]);

  useEffect(() => {
    let current = true;
    if (!id) return;
    setVoiceRoles([]);
    getCharacterVoiceRoles(id, 25, voiceLanguage).then((roles) => {
      if (current) setVoiceRoles(roles?.media?.edges || []);
    }).catch(() => {
      if (current) setVoiceRoles([]);
    });
    return () => { current = false; };
  }, [id, voiceLanguage]);

  useEffect(() => {
    if (pictures?.length) setOptimizedPictures(pictures);
  }, [pictures]);

  const handlePrev = useCallback(() => {
    setIndex((value) => optimizedPictures.length ? (value - 1 + optimizedPictures.length) % optimizedPictures.length : 0);
  }, [optimizedPictures.length]);
  const handleNext = useCallback(() => {
    setIndex((value) => optimizedPictures.length ? (value + 1) % optimizedPictures.length : 0);
  }, [optimizedPictures.length]);
  const handleBack = () => window.history.length > 2 ? navigate(-1) : navigate("/");
  const shareCharacter = async () => {
    const shareData = { title: characterName, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(shareData.url);
    } catch {
      // Closing the native share sheet is not an error the page needs to surface.
    }
  };
  const currentImage = optimizedPictures[index]?.jpg?.image_url || optimizedPictures[index]?.image || "";
  const voiceActors = [...new Map(voiceRoles.flatMap((edge: any) => (edge.voiceActorRoles || []).map((role: any) => [role.voiceActor?.id, { ...role.voiceActor, latestMedia: edge.node }])).filter(([actorId]: any) => actorId)).values()] as any[];

  return (
    <div className="character-gallery-page">
      <SEO
        title={`${characterName} - Character Artwork & Gallery`}
        description={`Browse character artwork and related official images for ${characterName} on Anime Orbit.`}
        keywords={`${characterName}, anime artwork, anime gallery, Anime Orbit`}
        image={currentImage || "https://animeorbit.web.app/animeorbit.jpg"}
        url={`https://animeorbit.web.app/character/${id}`}
      />

      <main className="character-gallery-shell">
        <header className="character-gallery-toolbar">
          <button type="button" onClick={handleBack} className="character-gallery-back">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div className="character-gallery-heading">
            <span>Character artwork</span>
            <h1>{characterName}</h1>
          </div>
          <div className="character-gallery-actions">
            <output aria-live="polite">
              {optimizedPictures.length ? `${index + 1} / ${optimizedPictures.length}` : "0 images"}
            </output>
            <button type="button" onClick={shareCharacter} aria-label={`Share ${characterName}`}>
              <Share2 size={16} />
              <span>Share</span>
            </button>
          </div>
        </header>

        <section className="character-gallery-stage" aria-label={`${characterName} image gallery`}>
          {currentImage ? (
            <ProgressiveImage
              src={currentImage}
              alt={`${characterName} artwork ${index + 1}`}
              wrapperClassName="character-gallery-image"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="character-gallery-empty">
              <ImageIcon size={42} />
              <strong>{loading ? "Loading artwork…" : "No artwork available"}</strong>
              <span>Try refreshing the character gallery.</span>
            </div>
          )}

          {optimizedPictures.length > 1 && (
            <div className="character-gallery-navigation">
              <button type="button" onClick={handlePrev} aria-label="Previous picture"><ChevronLeft size={24} /></button>
              <span>{index + 1} of {optimizedPictures.length}</span>
              <button type="button" onClick={handleNext} aria-label="Next picture"><ChevronRight size={24} /></button>
            </div>
          )}
        </section>

        {optimizedPictures.length > 1 && (
          <div className="character-gallery-thumbnails" aria-label="Choose character picture">
            {optimizedPictures.map((picture, pictureIndex) => {
              const thumbnail = picture?.jpg?.image_url || picture?.image;
              return (
                <button
                  type="button"
                  key={`${thumbnail}-${pictureIndex}`}
                  onClick={() => setIndex(pictureIndex)}
                  aria-label={`Show picture ${pictureIndex + 1}`}
                  aria-current={index === pictureIndex ? "true" : undefined}
                >
                  <img src={thumbnail} alt="" loading="lazy" />
                </button>
              );
            })}
          </div>
        )}

        <section className="character-voice-section">
          <header><div><span><Mic2 size={14} />{voiceLanguage === "JAPANESE" ? "Japanese" : "English"} voice cast</span><h2>Voices behind {characterName}</h2><p>Choose a language, then open an actor to see their complete role history.</p></div><div className="character-voice-language" role="group" aria-label="Voice language"><button type="button" className={voiceLanguage === "JAPANESE" ? "is-active" : ""} onClick={() => setVoiceLanguage("JAPANESE")}>Japanese</button><button type="button" className={voiceLanguage === "ENGLISH" ? "is-active" : ""} onClick={() => setVoiceLanguage("ENGLISH")}>English</button></div><b>{voiceActors.length} actors</b></header>
          {voiceActors.length ? <div className="character-voice-grid">{voiceActors.map((actor) => <Link to={`/voice-actor/${actor.id}`} key={actor.id}>
            <ProgressiveImage src={actor.image?.large || actor.image?.medium} alt={actor.name?.full} wrapperClassName="character-voice-image" className="h-full w-full object-cover" />
            <div><span>{actor.languageV2 || "Japanese"}</span><h3>{actor.name?.full}</h3><p><Calendar size={13} />{actor.latestMedia?.startDate?.year || "Year unknown"} · {actor.latestMedia?.title?.english || actor.latestMedia?.title?.romaji || "Anime role"}</p></div><ArrowRight size={17} />
          </Link>)}</div> : <div className="finder-empty">No voice cast allowed by the current mature-content preference was returned.</div>}
        </section>
      </main>
    </div>
  );
};

export default Gallery;
