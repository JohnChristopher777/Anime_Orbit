# 🗺️ Application Flow & Architecture

## Complete User Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      HOMEPAGE (/)                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  NAVBAR: [☰] ANIME ORBIT  [🔍 Search]  [👤 User]      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            HERO CAROUSEL (Optional)                     │    │
│  │  [Trending anime slides with auto-play]                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  POPULAR ANIME                    AIRING NOW                   │
│  [Grid of anime cards]            [Grid of anime cards]        │
│                                                                 │
│  UPCOMING ANIME                                                 │
│  [Grid of anime cards]                                          │
│                                                                 │
│         ↓ Click any anime card                                  │
└─────────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│              ANIME DETAIL PAGE (/anime/:id)                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  NAVBAR: [☰] ANIME ORBIT  [🔍 Search]  [👤 User]      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [← Back]                    [Home > Anime > {Title}]           │
│                                                                 │
│  ┌────────┐  ╔═══════════════════════════════════════════╗    │
│  │        │  ║ NARUTO SHIPPUDEN                          ║    │
│  │ Poster │  ║ ナルト 疾風伝                               ║    │
│  │        │  ║ ⭐8.2  🏆#42  📺TV  500 Eps  📅2007       ║    │
│  │ 300x   │  ║                                           ║    │
│  │ 450    │  ║ [❤️ Favorite] [🔖 Watchlist]              ║    │
│  │        │  ║ [✓ Watched]   [↗️ Share]                  ║    │
│  └────────┘  ╚═══════════════════════════════════════════╝    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ [Overview] [Episodes] [Characters] [Staff] [Related]  │    │
│  │ ══════════                                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  CURRENT TAB CONTENT:                                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • Synopsis with Read More                              │    │
│  │ • Genre badges                                         │    │
│  │ • Info grid (Studios, Producers, etc.)                 │    │
│  │ • Embedded trailer                                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│         ↓ Click Characters tab                                  │
└─────────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│              CHARACTERS TAB                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Naruto   │  │ Sasuke   │  │ Sakura   │  │ Kakashi  │       │
│  │ Uzumaki  │  │ Uchiha   │  │ Haruno   │  │ Hatake   │       │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤       │
│  │ Main     │  │ Main     │  │ Main     │  │ Main     │       │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤       │
│  │ 👤 Voice │  │ 👤 Voice │  │ 👤 Voice │  │ 👤 Voice │       │
│  │  Actor   │  │  Actor   │  │  Actor   │  │  Actor   │       │
│  │ Japanese │  │ Japanese │  │ Japanese │  │ Japanese │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│         ↓ Click character image                                 │
└─────────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│              GALLERY PAGE (/character/:id)                      │
│  [← Back]                                                       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │            [← Previous]                                │    │
│  │                                                         │    │
│  │                  Character Image                       │    │
│  │                     800 x 600                          │    │
│  │                                                         │    │
│  │            [Next →]                  [3 / 10]         │    │
│  │                                                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  • Navigation arrows                                            │
│  • Image counter                                                │
│  • 8-second timeout if no images                               │
│  • Auto-navigates back on timeout                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App.jsx
├── ToastContainer (global notifications)
│
├── Route: / (Homepage)
│   └── Layout
│       ├── NavbarNew
│       │   ├── MenuButton (☰)
│       │   ├── Logo (ANIME ORBIT)
│       │   ├── NavLinks
│       │   │   ├── Home
│       │   │   ├── Trending
│       │   │   └── Favorites
│       │   ├── SearchForm
│       │   └── UserMenu / SignInButton
│       │
│       ├── Homepage
│       │   ├── HeroCarousel (optional)
│       │   ├── Popular (anime cards)
│       │   ├── Airing (anime cards)
│       │   └── Upcoming (anime cards)
│       │
│       └── ScrollButton
│
├── Route: /anime/:id (Anime Detail)
│   └── Layout
│       ├── NavbarNew
│       │
│       ├── AnimeItemEnhanced
│       │   ├── Helmet (SEO meta tags)
│       │   ├── Breadcrumbs
│       │   ├── BackButton (← Back)
│       │   ├── BackgroundImage (blurred)
│       │   ├── Overlay
│       │   │
│       │   ├── HeroSection
│       │   │   ├── PosterImage
│       │   │   └── HeroContent
│       │   │       ├── TitleGroup
│       │   │       │   ├── MainTitle (English)
│       │   │       │   └── JapaneseTitle
│       │   │       ├── MetaInfo
│       │   │       │   ├── Score badge
│       │   │       │   ├── Rank badge
│       │   │       │   ├── Type badge
│       │   │       │   ├── Episodes badge
│       │   │       │   └── Year badge
│       │   │       └── ActionButtons
│       │   │           ├── Favorite button
│       │   │           ├── Watchlist button
│       │   │           ├── Watched button
│       │   │           └── Share button
│       │   │
│       │   ├── TabNavigation
│       │   │   ├── Overview tab
│       │   │   ├── Episodes tab
│       │   │   ├── Characters tab
│       │   │   ├── Staff tab
│       │   │   └── Related tab
│       │   │
│       │   └── ContentSection
│       │       ├── OverviewTab
│       │       │   ├── Synopsis (with Read More)
│       │       │   ├── GenresContainer
│       │       │   ├── InfoGrid (6 cards)
│       │       │   └── TrailerFrame
│       │       │
│       │       ├── EpisodesTab
│       │       │   └── EpisodeList
│       │       │       └── EpisodeCard (x N)
│       │       │
│       │       ├── CharactersTab
│       │       │   └── CharacterGrid
│       │       │       └── CharacterCard (x 12)
│       │       │           ├── CharacterImage
│       │       │           ├── CharacterInfo
│       │       │           └── VoiceActor
│       │       │
│       │       ├── StaffTab
│       │       │   └── StaffGrid
│       │       │       └── StaffCard (x 8)
│       │       │
│       │       └── RelatedTab
│       │           └── RelationGroup (x N)
│       │               └── RelationCard (x N)
│       │
│       └── ScrollButton
│
├── Route: /character/:id (Gallery)
│   └── Gallery
│       ├── BackButton
│       ├── ImageCarousel
│       │   ├── Previous arrow
│       │   ├── Current image
│       │   ├── Next arrow
│       │   └── Image counter
│       └── Skeleton loading
│
├── Route: /favourites
│   └── Layout
│       ├── NavbarNew
│       ├── Favourites (favorite anime grid)
│       └── ScrollButton
│
└── Route: /about
    └── AboutUs
```

---

## Context Providers Hierarchy

```
index.jsx
└── GlobalContextProvider
    └── FavouritesContextProvider
        └── AuthContextProvider
            └── WatchlistContextProvider
                └── App
                    └── (All components have access to contexts)
```

---

## State Management Flow

```
User Action → Component → Context Hook → Firestore/Local State → UI Update

Example: Add to Favorites
┌──────────────────────────────────────────────────────────────┐
│ User clicks "❤️ Favorite" button                             │
│         ↓                                                     │
│ AnimeItemEnhanced.handleFavouriteToggle()                    │
│         ↓                                                     │
│ Check if user is authenticated (useAuth)                     │
│         ↓                                                     │
│ If not authenticated:                                        │
│   → Open AuthModal                                           │
│         ↓                                                     │
│ If authenticated:                                            │
│   → useFavourites().addToFavourites(anime)                  │
│         ↓                                                     │
│ FavouritesContext updates Firestore                          │
│         ↓                                                     │
│ Local state updated                                          │
│         ↓                                                     │
│ UI re-renders with active favorite state                    │
│ (Heart icon fills with red, button text changes)            │
└──────────────────────────────────────────────────────────────┘
```

---

## API Integration Flow

```
Component Mount → Fetch Data → Update State → Render

AnimeItemEnhanced Fetching Strategy:
┌──────────────────────────────────────────────────────────────┐
│ useEffect runs on component mount                            │
│         ↓                                                     │
│ setLoading(true)                                             │
│         ↓                                                     │
│ Parallel API calls:                                          │
│   ├─→ GET /anime/{id}/full        → setAnime()             │
│   ├─→ GET /anime/{id}/characters  → setCharacters()        │
│   ├─→ GET /anime/{id}/episodes    → setEpisodes()          │
│   ├─→ GET /anime/{id}/relations   → setRelations()         │
│   └─→ GET /anime/{id}/staff       → setStaff()             │
│         ↓                                                     │
│ All promises resolved                                        │
│         ↓                                                     │
│ setLoading(false)                                            │
│         ↓                                                     │
│ Component renders with data                                  │
│         ↓                                                     │
│ If error: console.error() + empty state UI                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
Sign In Flow:
┌──────────────────────────────────────────────────────────────┐
│ User not authenticated                                        │
│         ↓                                                     │
│ User clicks "Sign In" button in NavbarNew                   │
│         ↓                                                     │
│ setAuthModalOpen(true)                                       │
│         ↓                                                     │
│ AuthModal appears                                            │
│         ↓                                                     │
│ User enters credentials                                      │
│         ↓                                                     │
│ Firebase Authentication                                      │
│         ↓                                                     │
│ AuthContext updates currentUser                             │
│         ↓                                                     │
│ AuthModal closes                                             │
│         ↓                                                     │
│ NavbarNew re-renders:                                        │
│   - Sign In button → User menu                              │
│   - Shows user avatar/icon                                   │
│   - Shows username                                           │
│   - Shows dropdown menu                                      │
│         ↓                                                     │
│ User can now:                                                │
│   - Add to favorites                                         │
│   - Add to watchlist                                         │
│   - Mark as watched                                          │
│   - Access profile                                           │
│   - Logout                                                   │
└──────────────────────────────────────────────────────────────┘

Logout Flow:
┌──────────────────────────────────────────────────────────────┐
│ User clicks dropdown menu                                    │
│         ↓                                                     │
│ Menu opens with options                                      │
│         ↓                                                     │
│ User clicks "Logout"                                         │
│         ↓                                                     │
│ handleLogout() calls Firebase signOut()                     │
│         ↓                                                     │
│ AuthContext updates currentUser to null                     │
│         ↓                                                     │
│ NavbarNew re-renders:                                        │
│   - User menu → Sign In button                              │
│   - Favorites link hidden                                    │
│         ↓                                                     │
│ Redirect to homepage (optional)                             │
└──────────────────────────────────────────────────────────────┘
```

---

## Share Feature Flow

```
Share Button Click:
┌──────────────────────────────────────────────────────────────┐
│ User clicks "↗️ Share" button                                │
│         ↓                                                     │
│ handleShare() function                                       │
│         ↓                                                     │
│ Prepare shareData:                                           │
│   - title: anime title                                       │
│   - text: description                                        │
│   - url: current page URL                                    │
│         ↓                                                     │
│ Check if navigator.share exists                             │
│         ↓                                                     │
│ IF YES (Mobile/Modern Browser):                             │
│   → navigator.share(shareData)                              │
│   → Native share dialog opens                               │
│   → User selects app to share to                            │
│   → Share completes                                          │
│         ↓                                                     │
│ IF NO (Desktop/Old Browser):                                │
│   → navigator.clipboard.writeText(url)                      │
│   → URL copied to clipboard                                 │
│   → toast.success("Link copied to clipboard!")             │
│   → Toast notification appears                              │
│         ↓                                                     │
│ IF ERROR:                                                    │
│   → console.error()                                          │
│   → (Silent fail, no user notification)                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior Flow

```
Window Resize → Media Query Check → Component Re-render

NavbarNew Responsive Breakpoints:
┌──────────────────────────────────────────────────────────────┐
│ 1024px+ (Desktop):                                           │
│   [☰] ANIME ORBIT  [🏠 Home] [📈 Trending] [❤️ Favs]       │
│                    [🔍 Search anime...]  [👤 Username ⌄]    │
│         ↓ Resize to 768-1023px                               │
├──────────────────────────────────────────────────────────────┤
│ 768-1023px (Tablet):                                         │
│   [☰] ANIME ORBIT                                            │
│                    [🔍 Search anime...]  [👤 Username ⌄]    │
│   (NavLinks hidden)                                          │
│         ↓ Resize to 640-767px                                │
├──────────────────────────────────────────────────────────────┤
│ 640-767px (Mobile):                                          │
│   [☰] ANIME ORBIT                                            │
│                    [🔍 Search anime...]  [👤 ⌄]             │
│   (Username hidden)                                          │
│         ↓ Resize to <640px                                   │
├──────────────────────────────────────────────────────────────┤
│ <640px (Small Mobile):                                       │
│   [☰] ANIME ORBIT                          [👤 ⌄]           │
│   (Search hidden)                                            │
└──────────────────────────────────────────────────────────────┘

AnimeItemEnhanced Responsive:
┌──────────────────────────────────────────────────────────────┐
│ 968px+ (Desktop):                                            │
│   ┌────────┐  ╔═══════════════════════╗                     │
│   │ Poster │  ║ Title & Info          ║                     │
│   │        │  ║ Meta badges           ║                     │
│   │        │  ║ Action buttons        ║                     │
│   └────────┘  ╚═══════════════════════╝                     │
│   (Side by side)                                             │
│         ↓ Resize to <968px                                   │
├──────────────────────────────────────────────────────────────┤
│ <968px (Mobile):                                             │
│   ┌─────────────────────┐                                    │
│   │      Poster         │                                    │
│   └─────────────────────┘                                    │
│   ╔═══════════════════════╗                                 │
│   ║ Title & Info          ║                                 │
│   ║ Meta badges           ║                                 │
│   ║ Action buttons        ║                                 │
│   ╚═══════════════════════╝                                 │
│   (Stacked vertically)                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
API Call → Success/Error → Update State → Show UI

Example: Fetch Anime Data
┌──────────────────────────────────────────────────────────────┐
│ fetch(https://api.jikan.moe/v4/anime/{id}/full)             │
│         ↓                                                     │
│ Response OK (200)?                                           │
│         ↓                                                     │
│ YES:                                                         │
│   → Parse JSON                                               │
│   → setAnime(data.data)                                     │
│   → setLoading(false)                                       │
│   → Render anime details                                    │
│         ↓                                                     │
│ NO (404, 500, etc.):                                        │
│   → console.error()                                          │
│   → setLoading(false)                                       │
│   → Render empty state or error message                     │
│         ↓                                                     │
│ NETWORK ERROR:                                              │
│   → catch(error)                                             │
│   → console.error(error)                                    │
│   → setLoading(false)                                       │
│   → Render "Failed to load" message                         │
└──────────────────────────────────────────────────────────────┘

Gallery Timeout:
┌──────────────────────────────────────────────────────────────┐
│ Component mounts                                             │
│         ↓                                                     │
│ useEffect runs                                               │
│         ↓                                                     │
│ setTimeout(8000ms)                                           │
│         ↓                                                     │
│ Wait 8 seconds...                                            │
│         ↓                                                     │
│ Check if optimizedPictures.length === 0                     │
│         ↓                                                     │
│ IF TRUE (no images):                                        │
│   → navigate(-1)                                             │
│   → User returns to previous page                           │
│         ↓                                                     │
│ IF FALSE (images loaded):                                   │
│   → Do nothing                                               │
│   → User continues viewing images                           │
│         ↓                                                     │
│ Component unmounts:                                          │
│   → clearTimeout(timeoutId)                                 │
│   → Cleanup complete                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
                    ┌──────────────┐
                    │   Firebase   │
                    │  Firestore   │
                    └──────┬───────┘
                           │
                    ┌──────▼──────┐
                    │   Contexts  │
                    │  (Providers)│
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼────┐     ┌─────▼────┐
    │  Auth   │      │Favourites│     │Watchlist │
    │ Context │      │ Context  │     │ Context  │
    └────┬────┘      └─────┬────┘     └─────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼──────┐
                    │     App     │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼────┐     ┌─────▼────┐
    │Homepage │      │  Anime   │     │ Gallery  │
    │         │      │  Item    │     │          │
    └─────────┘      │ Enhanced │     └──────────┘
                     └─────┬────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼────┐     ┌─────▼────┐
    │Overview │      │Episodes  │     │Characters│
    │   Tab   │      │   Tab    │     │   Tab    │
    └─────────┘      └──────────┘     └──────────┘
```

---

## Performance Optimization Points

```
1. Code Splitting:
   ┌─────────────────────────────────────┐
   │ App.jsx                             │
   │   ├─→ Homepage (lazy load)          │
   │   ├─→ AnimeItemEnhanced (lazy)     │
   │   └─→ Gallery (lazy)                │
   └─────────────────────────────────────┘
   Result: Smaller initial bundle size

2. API Response Caching:
   ┌─────────────────────────────────────┐
   │ Fetch anime data                    │
   │   ↓                                 │
   │ Cache in localStorage               │
   │   ↓                                 │
   │ Next visit: Load from cache         │
   │   ↓                                 │
   │ Background refresh from API         │
   └─────────────────────────────────────┘
   Result: Faster load times

3. Image Lazy Loading:
   ┌─────────────────────────────────────┐
   │ Scroll down page                    │
   │   ↓                                 │
   │ Intersection Observer triggers      │
   │   ↓                                 │
   │ Load image only when in viewport    │
   └─────────────────────────────────────┘
   Result: Reduced initial page weight

4. Skeleton Screens:
   ┌─────────────────────────────────────┐
   │ Component mounts                    │
   │   ↓                                 │
   │ Show skeleton (immediate)           │
   │   ↓                                 │
   │ Fetch data in background            │
   │   ↓                                 │
   │ Replace skeleton with real content  │
   └─────────────────────────────────────┘
   Result: Better perceived performance
```

---

## 🎯 Complete Feature Map

```
ANIME ORBIT APPLICATION
│
├─ Navigation (NavbarNew)
│  ├─ Logo (ANIME ORBIT)
│  ├─ Menu Toggle
│  ├─ Search
│  └─ User Menu
│     ├─ Profile
│     ├─ Favorites
│     ├─ Watchlist
│     └─ Logout
│
├─ Homepage
│  ├─ Hero Carousel (optional)
│  ├─ Popular Anime
│  ├─ Airing Now
│  └─ Upcoming
│
├─ Anime Detail (AnimeItemEnhanced)
│  ├─ Navigation
│  │  ├─ Back Button
│  │  └─ Breadcrumbs
│  │
│  ├─ Hero Section
│  │  ├─ Poster
│  │  ├─ Title (EN + JP)
│  │  ├─ Meta Badges
│  │  └─ Action Buttons
│  │     ├─ Favorite
│  │     ├─ Watchlist
│  │     ├─ Watched
│  │     └─ Share
│  │
│  └─ Tabs
│     ├─ Overview
│     │  ├─ Synopsis
│     │  ├─ Genres
│     │  ├─ Info Grid
│     │  └─ Trailer
│     │
│     ├─ Episodes
│     │  └─ Episode List
│     │
│     ├─ Characters
│     │  └─ Character Cards
│     │     ├─ Image
│     │     ├─ Name
│     │     ├─ Role
│     │     └─ Voice Actor
│     │
│     ├─ Staff
│     │  └─ Staff Cards
│     │     ├─ Photo
│     │     ├─ Name
│     │     └─ Position
│     │
│     └─ Related
│        └─ Related Series
│           ├─ Sequels
│           ├─ Prequels
│           ├─ Side Stories
│           └─ Spin-offs
│
├─ Gallery
│  ├─ Image Carousel
│  ├─ Navigation Arrows
│  ├─ Image Counter
│  └─ Auto-timeout
│
└─ Favorites
   └─ Favorite Anime Grid
```

---

## 🎨 Visual State Indicators

```
Button States:
┌──────────────────────────────────────────────────────────────┐
│ DEFAULT:    [ Button Text ]                                  │
│             ┌──────────────┐                                 │
│             │  Normal      │  rgba(255,255,255,0.05)         │
│             └──────────────┘  Border: rgba(255,255,255,0.2) │
│                                                              │
│ HOVER:      [ Button Text ]                                  │
│             ┌──────────────┐                                 │
│             │  Hover ⬆     │  rgba(255,215,0,0.2)           │
│             └──────────────┘  Border: #ffd700                │
│                                transform: translateY(-2px)   │
│                                                              │
│ ACTIVE:     [❤️ Favorite]                                   │
│             ┌──────────────┐                                 │
│             │  Active      │  rgba(255,77,77,0.2)           │
│             └──────────────┘  Border: #ff4d4d                │
│                                Icon filled with color        │
│                                                              │
│ DISABLED:   [ Button Text ]                                  │
│             ┌──────────────┐                                 │
│             │  Disabled    │  opacity: 0.5                   │
│             └──────────────┘  cursor: not-allowed            │
└──────────────────────────────────────────────────────────────┘

Tab States:
┌──────────────────────────────────────────────────────────────┐
│ INACTIVE:   [Tab Name]                                       │
│             ──────────  (no underline)                       │
│             Color: rgba(255,255,255,0.6)                     │
│                                                              │
│ ACTIVE:     [Tab Name]                                       │
│             ══════════  (gold underline)                     │
│             Color: #ffd700                                   │
│             Background: rgba(255,215,0,0.2)                 │
└──────────────────────────────────────────────────────────────┘

Loading States:
┌──────────────────────────────────────────────────────────────┐
│ SKELETON:   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  (animated shimmer)            │
│             ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                 │
│             ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                 │
│                                                              │
│ CONTENT:    Actual text and images                          │
│             rendered after loading                           │
└──────────────────────────────────────────────────────────────┘
```

---

This architecture ensures:

- ✅ Clear data flow
- ✅ Proper state management
- ✅ Responsive user experience
- ✅ Error handling
- ✅ Performance optimization
- ✅ Maintainable code structure

**All components work together seamlessly!** 🚀
