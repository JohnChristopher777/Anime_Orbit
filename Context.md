# Anime Orbit — Persistent Product Context

Last updated: 2026-09-19

## How to maintain this file

- Add every new user request as a checklist before implementation.
- Mark an item `[x]` only after implementation and verification.
- Keep incomplete or changed requirements as `[ ]`; add a short note describing the current state.
- Preserve product decisions and schemas needed by future work. Do not store secrets, Firebase credentials, or user data here.

## Permanent product decisions

- Visual direction: polished anime-streaming UI; dark neutral surfaces, restrained yellow accent, familiar anime wording, no vague technical copy.
- Mobile: plain/static background, minimal blur and animation, compact spacing, responsive content separation.
- Images: progressive skeleton loading; `/lost.jpg` white fallback with contained artwork. Hero art loads eagerly; other art is lazy.
- Controls: application dropdowns use the shared web-style `AppDropdown`; navbar profile remains a compact dropdown.
- Data: public anime/manga metadata is read from AniList via `POST https://graphql.anilist.co`; requests are cached and batched where practical.
- User data: watchlist, favourites, reviews, comments, votes, notes, dates, progress, and deletion recovery records use Firebase/Firestore.
- Destructive list actions must be reversible. Soft-deleted records live for 5 days before becoming eligible for permanent cleanup.
- Franchise merging must be optional, reversible, and must never overwrite the original per-title records.

## Historical request checklist

### Foundation, homepage, loading, discovery

- [x] Make homepage anime categories single horizontal rows with full-page links.
- [x] Replace image spinners with skeleton loading and use `/lost.jpg` on failures.
- [x] Prioritize hero images and stabilize hero height/crop/navigation.
- [x] Add row arrows, hidden scrollbars, and slow cursor-steered marquee without mouse-wheel hijacking.
- [x] Make Popular, Airing, and Upcoming grids six titles per desktop row.
- [x] Add loading states to Load More actions.
- [x] Give homepage features distinct explanatory sections and links.
- [x] Add every major sidebar feature to the homepage feature guide.
- [x] Reduce mobile effects and excessive page-to-navbar spacing.
- [x] Rebuild discovery with screenshot, scene description, dialogue, mood, and personalized recommendation paths.
- [x] Remove watcher-facing provider/configuration jargon from discovery.
- [x] Use favourites and watchlist data for Discover “For You”.
- [ ] Keep validating discovery providers against real queries; external trace/image providers can still be unavailable independently.

### Anime, manga, genres, navigation

- [x] Restore working AnimeItem routing and skeleton loading.
- [x] Show series-specific legal sources, trailer fallback search, share actions, metadata, and colored platform/source tags.
- [x] Add MangaItem skeletons, watchlist status control, dates/status/latest chapter metadata, and share action.
- [x] Fix manga gallery/nav overlap and close-button visibility.
- [x] Add full manga catalogue search.
- [x] Redesign genre browser while keeping desktop sidebar placement and mobile horizontal rail.
- [x] Add genre rail controls and scroll-progress indicator.
- [x] Highlight current sidebar route; make profile avatar open Profile; add Watchlist to navbar.
- [x] Add divider above My Favorites in the sidebar.
- [x] Make auth dialog full-viewport where needed and keep mobile search compact under the navbar.
- [x] Enable one-character anime and watchlist-add searches.

### Watchlist, favourites, profile, privacy

- [x] Add anime/manga tabs, separate statuses, Caught Up, notes, start/end dates, and status colors.
- [x] Add numbered watchlist ordering based on earliest start/add date.
- [x] Add direct Add Anime/Manga search with recommendations excluding existing titles.
- [x] Add episode progress and score editing for anime.
- [x] Prompt review for completed/final-episode/paused/dropped titles without a review.
- [x] Keep shared HTML/text exports free of Firebase UID values.
- [x] Limit public profile rendering to safe display fields.
- [x] Replace profile “AI dashboard” styling with compact library demographics.
- [ ] Move public-profile storage to a dedicated public-safe collection; current UI abstracts fields but the legacy users collection rule still permits public reads.

### Community, reviews, comments

- [x] Remove composite-index dependency from review/comment loading and support string/number legacy anime IDs.
- [x] Add comment likes, dislikes, reports, replies, and one-level YouTube-style branching.
- [x] Update Firestore rules for reactions and legacy comments without reaction arrays.
- [x] Keep reviews accessible through `?tab=reviews` review triggers.

### Polls and franchise ranking

- [x] Add a weekly Fall poll with AniList seasonal choices, cover art, real-time totals, and percentage fills.
- [x] Add optional franchise-merged community ranking using AniList relation edges.
- [ ] Deploy updated Firestore rules; local source is ready but production deployment is external.

## Current request — 2026-09-18/19

- [x] Redesign watchlist cards: only a modest size increase, cleaner placement, compact details, and actions using remaining space.
- [x] Replace immediate watchlist removal with soft delete, Undo toast, a global Trash view, and five-day retention.
- [x] Match mobile search colors, border, blur, and result styling to desktop.
- [x] Remove the homepage Arrange Shelves feature.
- [x] Add a full Franchise Rankings page.
- [x] Add franchise detail pages with combined stats, release-order walkthrough, and links back to each AnimeItem/MangaItem.
- [x] Add franchise/backtrack links inside AnimeItem and MangaItem.
- [x] Allow anonymous poll voting with a persistent installation key and store global vote records in Firebase. This prevents easy repeat votes on one installation; strong cross-device abuse prevention still needs Firebase App Check/server validation.
- [x] Redesign poll options with clean diagonal cross-cut cover compositions; reveal results only after selection.
- [x] Rework MangaItem mobile layout and hierarchy.
- [x] Add a paged chapter guide and clearly identify that AniList supplies chapter totals, not official per-chapter names/descriptions.
- [x] Stabilize YouTube-style discussion controls so desktop button layout does not jump before/after selection.
- [x] Add unique profile identity treatment plus interest web/radar chart.
- [x] Calculate profile watch hours and total episodes from editable watchlist progress (TV average 24 minutes; movies two hours).
- [x] Ensure Watching, On-Hold, and Dropped entries retain editable episode progress; status changes remain explicit.
- [x] Add reversible franchise grouping filters to Watchlist and Favourites tier list.
- [x] Franchise aggregate rules: earliest start, latest end, notes kept as distinct per-title entries, and total episode progress summed with null-safe fallbacks.
- [x] Create and maintain this permanent `Context.md` checklist.

## Active schemas

### Watchlist item

`users/{uid}/watchlist/{mediaKey}` stores `mal_id`, `mediaType`, title/image metadata, status, `progress`, total episodes/chapters, `startDate`, `endDate`, `personalNotes`, score, and timestamps.

### Soft-deleted library item

`users/{uid}/trash/{mediaKey}` stores the complete original item plus `sourceCollection`, Firestore Timestamp fields `deletedAt` and `purgeAfter`. Undo restores the original key without data loss. Expired entries are purged when the signed-in user's Trash listener runs; production may additionally enable a Firestore TTL policy on `purgeAfter`.

### Weekly poll

`seasonPolls/{pollId}/votes/{voterKey}` stores one choice. Anonymous voting uses a persistent random installation ID with guest create/update rules. This is best-effort duplicate prevention, not a proof of one human per vote.

### Franchise grouping

AniList `PREQUEL`, `SEQUEL`, `PARENT`, `SIDE_STORY`, and `ALTERNATIVE` relation edges are unioned into groups. UI aggregation is derived only; original Firestore title records stay unchanged.

## Current correction batch — 2026-09-19

- [x] Automatically use Watching when episode progress begins and Completed only when the full episode count is reached. Selecting Completed directly fills a known episode total.
- [x] Make Watchlist removal reliable when cloud Trash permissions have not yet deployed, while retaining Undo and five-day recovery through a local fallback.
- [x] Extend Trash recovery to Favorites.
- [x] Add a separate manga Favorites collection and Favorites-page section.
- [x] Make the weekly poll visually unmistakable and keep voting usable when anonymous Firestore writes are unavailable; offline/rules fallback is installation-local until global sync succeeds.
- [x] Add Franchises to the sidebar before About and restore the divider after About.
- [x] Redesign Franchise Rankings cards and franchise detail hero/artwork for desktop and mobile.
- [x] Add franchise search and paged Load More covering the fetched catalogue.
- [x] Use portrait poster art for the homepage hero on mobile only.
- [x] Prevent image skeletons from remaining indefinitely after cached, stalled, or failed image loads.
- [x] Replace repetitive homepage feature banners with distinct interactive previews reflecting each destination.

## Current correction batch — franchise, genres and progress

- [x] Repair the selected franchise detail layout so artwork and titles remain proportionate without character-by-character wrapping.
- [x] Ensure every Browse Genres image comes from the exact anime title shown beneath it through one batched AniList ID lookup and stable fallback behavior.
- [x] Add editable manga chapter progress with Reading/Completed state logic matching anime episode behavior; partial status edits retain existing progress.
- [x] Add modern personal progress bars to AnimeItem and MangaItem.
- [x] Remove out-of-scope “full series pages” wording.
- [x] Simplify homepage feature copy and layouts into a compact mixed-size feature grid with destination-specific previews and controls.
- [x] Make the homepage Franchise section visually explicit with a dedicated watch-order treatment and direct franchise links.

## Current correction batch — layout regressions and interaction fixes

- [x] Restore the genre hero banner independently; exact-title images apply only to Browse Genres thumbnails and fall back locally without showing a broken remote image.
- [x] Fit three compact Watchlist cards per desktop row while allowing an expanded card to span two columns without disturbing nearby cards.
- [x] Add breathing room and clearer grouping to the homepage feature grid with two cards per desktop row and full-width feature moments.
- [x] Replace the Merge related entries checkbox presentation with an accessible switch-style toggle.
- [x] Repair franchise-detail hero positioning so banner artwork fills the surface and the content starts at the left without a dead column.
- [x] Make mobile search-result selection navigate immediately through a real route link and close the result surface.
- [x] Replace progress number-only controls with accessible draggable range sliders in AnimeItem, MangaItem, and expanded Watchlist editors while retaining precise step controls.
- [x] Repair the profile interest spider chart with legacy-genre backfill, visible grid rings/axes, and a stronger profile identity treatment.

## Current correction batch — trackers, site guide and franchise timeline

- [x] Remove the routine “Anime tracker saved” success toast while retaining meaningful completion/error feedback.
- [x] Replace the boxed homepage site guide with clean, alternating, image-led feature sections and remove feature-status chips.
- [x] Add Caught Up to the AnimeItem tracking choices and keep MangaItem tracking on the same shared dropdown UI.
- [x] Move MangaItem action controls below the poster on desktop and mobile.
- [x] Fix the franchise detail background as a true full-bleed banner rather than a dark/empty surface.
- [x] Add franchise timeline filters for All, Anime, Manga, Novel, Specials, and Movies with related formats grouped correctly.
- [x] Add a separate tier list for manga in Favorites with persistent tier membership and ordering.

### Implementation notes

- Anime and manga detail trackers now use the shared `AppDropdown`; anime includes Caught Up and manga retains reading-specific labels.
- Franchise detail media is explicitly positioned as an absolute full-surface layer so the shared progressive-image wrapper cannot collapse the banner.
- Franchise filters are derived from AniList media type/format and do not alter the chronological source data.
- Manga tier membership is stored separately in `anime_orbit_manga_tierlist`; the original favorites records remain untouched and reversible.
