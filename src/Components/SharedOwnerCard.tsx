import React from "react";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { SharedOwner } from "../utils/shareOwner";
import ProgressiveImage from "./ProgressiveImage";

const SharedOwnerCard: React.FC<{ owner: SharedOwner | null }> = ({ owner }) => {
  if (!owner) return null;
  const content = (
    <>
      {owner.avatarUrl ? (
        <ProgressiveImage
          src={owner.avatarUrl}
          fallbackSrc="/pwa-icon-192.png"
          alt={`${owner.displayName}'s avatar`}
          wrapperClassName="shared-owner-avatar"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="shared-owner-avatar shared-owner-avatar--fallback">
          {owner.displayName[0]?.toUpperCase() || "A"}
        </span>
      )}
      <div>
        <span>Shared by</span>
        <h2>{owner.displayName}</h2>
        <p>This is the sender's published Anime Orbit identity.</p>
      </div>
      {owner.profileHandle ? (
        <span className="shared-owner-action">
          View profile <ExternalLink size={15} />
        </span>
      ) : (
        <small>Public profile link unavailable</small>
      )}
    </>
  );

  const style = owner.bannerUrl
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(8,8,12,.94), rgba(12,12,18,.82)), url("${owner.bannerUrl}")`,
      }
    : undefined;

  return owner.profileHandle ? (
    <Link
      to={`/user/${owner.profileHandle}`}
      className="shared-owner-card shared-owner-card--linked"
      aria-label={`View ${owner.displayName}'s public profile`}
      style={style}
    >
      {content}
    </Link>
  ) : (
    <section className="shared-owner-card" aria-label="Shared by" style={style}>
      {content}
    </section>
  );
};

export default SharedOwnerCard;
