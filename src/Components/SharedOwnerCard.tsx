import React from "react";
import { ExternalLink, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import type { SharedOwner } from "../utils/shareOwner";
import ProgressiveImage from "./ProgressiveImage";

const SharedOwnerCard: React.FC<{ owner: SharedOwner | null }> = ({ owner }) => {
  if (!owner) return null;
  return (
    <section className="shared-owner-card" aria-label="Shared by">
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
          <UserRound size={24} />
        </span>
      )}
      <div>
        <span>Shared by</span>
        <h2>{owner.displayName}</h2>
        <p>This is the sender's published Anime Orbit identity.</p>
      </div>
      {owner.profileHandle ? (
        <Link to={`/user/${owner.profileHandle}`}>
          View profile <ExternalLink size={15} />
        </Link>
      ) : (
        <small>Public profile link unavailable</small>
      )}
    </section>
  );
};

export default SharedOwnerCard;
