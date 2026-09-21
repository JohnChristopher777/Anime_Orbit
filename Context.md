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

## Current correction batch — 2026-09-20

- [x] Prevent first-load/offscreen images from incorrectly falling back to the same local artwork; keep skeletons reliable with lazy loading.
- [x] Place the Undo action at the far-right edge of removal toasts.
- [x] Order homepage catalogue rows as Popular, New Episodes, then Coming Soon.
- [x] Give Franchise Rankings the shared catalogue header with loaded count and filter dropdown.
- [x] Add genre dropdown filters to homepage rows and the Popular, Airing, and Upcoming pages.
- [x] Move Favorites tier Add Row and Reset controls below the final tier; Reset requires confirmation.
- [x] Apply the same tier-control logic and visual language to manga Favorites, media-specific Trash views, and Franchise view.
- [x] Keep switch/button motion fluid and capped below 500ms.
- [x] Improve Profile section hierarchy so identity, headline stats, progress, genres, and interest chart are immediately distinguishable.
- [x] Change desktop navigation destinations to Popular and Airing; shorten the profile label to first name with a five-character maximum.
- [x] Replace expanded Watchlist Close Details/Delete actions with Save and Cancel semantics.
- [x] Normalize Watchlist status colors to a restrained palette; use status color only for the side strip and episode/chapter tag.
- [x] Integrate a secure Gemini-backed discovery gateway for image, scene, character/setting, and dialogue matching, then resolve candidates against AniList.
- [x] Repair gallery picture refresh and make recommendation refresh return a new eligible slice.
- [x] Redesign Favorites grid view with persistent visible numbering and stronger hierarchy.
- [ ] Configure `GEMINI_API_KEY` in the Netlify server environment when deploying; the key must never be placed in a `VITE_` browser variable.

### 2026-09-20 implementation notes

- Lazy-image failure timers start only when an image is within 600px of the viewport, so valid native-lazy requests are not replaced before loading begins.
- Catalogue genre filters derive their choices from the currently loaded titles and do not trigger redundant network requests.
- Gemini requests use `/.netlify/functions/discovery`, structured JSON, compressed inline images, remote-image size/private-network guards, and AniList title resolution. trace.moe and local/AniList clue matching remain fallbacks.
- Anime and manga tier membership remain separate and reversible. Trash content follows the active Anime/Manga tab.

## Current correction batch — profile, manga favourites and tracker clarity

- [x] Increase muted Profile labels for readability and remove the decorative yellow side rule.
- [x] Bring Manga Favorites to feature parity with Anime Favorites, including add, tier management, numbered grid, and Trash flows.
- [x] Move MangaItem chapter progress below its action buttons; completing fills the total and reducing progress returns the title to Reading. Apply the equivalent Watching rule to anime progress.
- [x] Keep tracker dropdown choices neutral except for the destructive Remove action.
- [x] Use state colour only on each Watchlist title's status chip, not its card edge or progress tag.
- [x] Add Popular to the sidebar.
- [x] Expand the footer with newer destinations and render it on Watchlist, Reviews, Discussions, and other missing catalogue pages.
- [x] Make Watchlist Trash discoverable with a visible item count and active state.

### 2026-09-20 implementation notes

- Manga Favorites now searches AniList directly, supports persistent tier creation/reordering/renaming/removal, exposes its add action from the waiting pool, and orders its numbered grid from saved tier ranks.
- Episode and chapter progress enforce one consistent rule in detail pages and expanded Watchlist editors: reaching the known total completes the title; reducing a completed total resumes Watching or Reading.
- Watchlist status filters stay neutral, while the compact status chip is the sole state-colour indicator on each title card.

## Header alignment correction — 2026-09-20

- [x] Match Watchlist, Reviews, and Discussions page headers to Favorites with the same screen margins, title typography, divider spacing, and separate count badge.

## Current consistency batch — 2026-09-20

- [x] Add restrained yellow highlights, borders, and primary controls to Watchlist cards while retaining status colour on the status chip.
- [x] Present manga Favorites inside the same tier workspace pattern as anime while keeping manga ranks separately persisted.
- [x] Replace the three homepage row filters with one universal genre filter controlling Popular, New Episodes, and Coming Soon.
- [x] Use the `ListTodo` icon for Watchlist destinations throughout the site.
- [x] Match AnimeItem's list selector to the other action buttons and give its progress panel the shared frosted treatment.
- [x] Restore the large AnimeItem artwork backdrop on mobile.

### 2026-09-20 implementation notes

- The homepage selector derives genres from all three loaded collections and passes one controlled genre into each row; full catalogue pages retain their own filters.
- Manga and anime tier data remain independent, but both now use the same responsive tier workspace with ranked rows and a separate waiting column.
- AnimeItem restores its banner/poster backdrop below 768px with a dark fade so the foreground poster and controls remain readable.

## Current media fallback and Favorites correction — 2026-09-21

- [x] Use the original rich Anime Favorites tier workspace for both Anime and Manga tabs; only the active media data, tier storage, notes, links, add picker, and labels change.
- [x] Keep Anime and Manga tier membership and notes independently persisted without rendering a separate simplified manga board.
- [x] Make Anime and Manga Favorites grid view share the same card layout and numbering behavior.
- [x] Match Favorites add/search dialogs to the Watchlist picker: above navigation, viewport-safe, one-character search, loading skeletons, recommendations, and reliable result scrolling.
- [x] Add a key-free Kitsu fallback linked through AniList `idMal` for episode/chapter metadata and trailers.
- [x] Keep AniList explicit or next-airing episode totals authoritative; use Kitsu totals only when AniList has no count so long-running series are not inflated by stub records.
- [x] Restore missing AnimeItem trailers from Kitsu when AniList has none.
- [x] Enrich AnimeItem episode batches with available titles, summaries, dates, lengths, and thumbnails as the selected range changes.
- [x] Resolve MangaItem chapter totals with fallback data and paginate available chapter titles, summaries, and publication dates without inventing missing text.
- [x] Sync corrected episode/chapter totals back into Firebase watchlist records so detail pages, progress controls, and Watchlist agree.
- [x] Restyle AnimeItem progress as a rounded frosted action surface with button-matched borders, controls, and yellow interaction accents.

### Implementation notes

- The public Kitsu JSON:API is called through `/api/edge`; mapping lookup uses the MyAnimeList bridge and exact-title lookup is a fallback when a mapping is absent.
- Supplemental requests use a seven-second abort timeout and five-minute in-memory cache. Any Kitsu failure returns the AniList record instead of blocking the page.
- Chapter records frequently omit official names or summaries. The UI displays a neutral numbered fallback and never presents generated text as official metadata.

## Current layering, navigation, metadata and readability correction — 2026-09-21

- [x] Render Favorites Anime/Manga add-search dialogs above the sticky navigation through document-level portals.
- [x] Separate the AnimeItem footer from the final content section and remove trailing page padding below the footer.
- [x] Correct the homepage universal genre menu stacking order above all three catalogue rails.
- [x] Support native trackpad horizontal scrolling on Popular, New Episodes, and Coming Soon, pausing automatic movement during user input.
- [x] Keep the green Favorites selected state and add a glowing red soft-trash action that uses the existing five-day recovery flow.
- [x] Increase small informative typography in Profile, Franchise, and the global footer to the established Watchlist readability range.
- [x] Add Jikan episode-title/date fallback after AniList/Kitsu and stop presenting generated episode placeholders as published metadata.
- [x] Add chapter range navigation matching the episode range row and label unavailable chapter details honestly.
- [x] Expose the same Share Tier List action for Manga Favorites, using manga tiers, ranks, notes, and titles in the export.

### Implementation notes

- Homepage rails preserve vertical wheel scrolling; direct horizontal deltas and Shift+wheel move the rail, and automatic marquee movement pauses for five seconds afterward.
- AniList remains authoritative for totals. Kitsu supplies rich episode/chapter fields where present, while Jikan supplies missing anime episode titles and air dates by MAL ID. No source is used to fabricate chapter names or summaries.
- Favorites modal portals use a page-level stacking context so their search fields and results cannot be clipped by page containers or covered by navigation.

## Manga metadata, genre mode and supporting-copy correction — 2026-09-21

- [x] Increase the small supporting labels, descriptions, list metadata, and actions in Favorites Trash, Watchlist Trash, and MangaItem without enlarging unrelated page titles.
- [x] Remove Kitsu's unsupported `sort=number` chapter parameter that caused HTTP 400 responses.
- [x] Use AniList's chapter total when available; otherwise derive the highest numeric English chapter from MangaDex instead of trusting Kitsu's inflated relationship count.
- [x] Display available Kitsu chapter names and lengths in 50-chapter ranges with the same active/inactive button treatment as AnimeItem episode ranges.
- [x] Use Kitsu episode thumbnails when published and the title's banner/poster as a visual fallback instead of an empty black episode image.
- [x] Add an Anime/Manga switch to Genres, with independent AniList manga queries, manga cards, pagination, sorting, SEO text, and MangaItem genre deep links.
- [x] Force Manga genre card artwork to fill and crop consistently inside the 2:3 cover surface, including fallback artwork.

### Implementation notes

- Kitsu's One Piece manga record reports no explicit chapter count and exposes thousands of pre-generated stub rows, so its relationship `meta.count` is intentionally ignored for manga totals.
- MangaDex is used only as a public metadata fallback for the highest available numeric chapter; Kitsu remains the supplemental source for chapter titles and lengths.
- User-provided AnimeItem alignment/responsiveness changes were preserved; this batch only added the episode-image fallback prop inside that component.

## Manga provider stability, genre cards and publication labels — 2026-09-21

- [x] Stop sending Kitsu chapter relationship requests with unsupported 50-item limits; keep 50-item UI ranges while fetching accepted 20 + 20 + 10 chunks.
- [x] Stop calling MangaDex directly from the browser. Resolve missing totals through the same-origin `/api/manga-metadata` endpoint with retries, timeouts, caching, and a non-breaking fallback response.
- [x] Skip MangaDex entirely whenever AniList already supplies a chapter total.
- [x] Make manga results in Genres use the same 2:3 artwork component, crop, metadata baseline, and responsive grid behavior as anime results.
- [x] Distinguish Manga, Manhwa, Manhua, Light Novel, and One-shot using AniList format plus country of origin across manga catalogue, Genres, details, Favorites, Watchlist, profile cards, and franchise entries.

### Implementation notes

- The Netlify redirect maps `/api/manga-metadata` to a serverless function; Vite exposes the identical route during local development. Supplemental MangaDex outages now fail on the server and return `{ chapterCount: 0 }` instead of surfacing browser connection-reset errors.
- Existing saved records without country-of-origin data retain their truthful stored `Manga` label. Newly searched or saved records persist the more precise publication label.
