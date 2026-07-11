# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server at http://localhost:3000 (auto-opens browser)
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
npm run lint      # ESLint, zero warnings threshold
```

There is no test suite.

### TMDB API key

Without a key the app runs in **Demo mode** using `src/constants/mockData.js`. To enable live data, create `.env`:
```
VITE_TMDB_API_KEY=your_key_here
```
`hasKey()` in `src/constants/api.js` gates all real API calls.

## Architecture

**React 18 + Vite 5, JSX only (no TypeScript), no UI library, no state manager.**

All state lives in `App.jsx` and is passed down via props — two levels deep at most. No Context, no Zustand.

### Styling system (two layers, both must stay in sync)

1. **`src/constants/tokens.js`** — exports `G`, a JS object used for inline styles and dynamic values (e.g. `color: G.accent`).
2. **`src/styles.css`** — the single CSS file, imported in `main.jsx`. Contains resets, keyframes, CSS custom properties (`--accent`, `--border`, etc.) mirroring `G` values, and all component class definitions.

Rule of thumb: use a CSS class for static styles, inline style only when the value is dynamic (conditional color, computed width, etc.).

### Persistence

Everything is `localStorage`. No backend.

- **`src/constants/storage.js`** exports `LS` (get/set wrapper) and `SK` (key constants).
- All keys are prefixed `tt_`. Defaults: `LS.get(SK.W)` → `{}`, not `[]`.
- Key formats for watched data:
  - Watched title: `tv_${id}` or `movie_${id}`
  - Watched episode: `ep_show${showId}_ep${epId}`
  - Watchlist entry: `${media_type}_${id}`

### Auth

`src/auth/Auth.js` is a fully mock implementation backed by `localStorage`. Passwords are stored in plaintext in `tt_users_db`. Designed to be replaced with Supabase — see README for the method mapping.

### Custom hooks

- **`src/hooks/useWatchlistToggle.js`** — `useCallback` wrapping the watchlist add/remove logic. Used in ShowsTab, MoviesTab, DiscoverTab, DetailSheet. Always pass an item with `media_type` set (e.g. `{...item, media_type: "tv"}`).
- **`src/hooks/useTMDB.js`** — wraps `tmdb()` calls with `AbortController` cleanup and a 5-minute module-level `Map` cache. Accepts `fetchFn | null` (pass `null` to skip the effect). Used for trending and browse fetches in DiscoverTab. Falls back to mock data when `!hasKey()` or on error.

### Code splitting

`DetailSheet`, `Importer`, and `AuthScreen` are `React.lazy` imports in `App.jsx`, wrapped in `<Suspense>`. `ShowsTab`, `MoviesTab`, `DiscoverTab`, `ProfileTab` are eager — they're always needed on load.

### Performance

`PosterCard` and `EpisodeRow` are wrapped with `React.memo`. Computed/filtered lists in ShowsTab, MoviesTab, and ProfileTab use `useMemo`.

### TMDB API

`src/constants/api.js` exports `tmdb(path, params?, signal?)`. The optional `signal` is an `AbortSignal` for cancellation. Images use `TMDB_IMG` base URL (e.g. `${TMDB_IMG}/w300${poster_path}`).

### Notable files

- `tvtime-roadmap.jsx` — planning document in the project root, not imported anywhere in the app.
- `src/features/Confetti.jsx` — triggers on show completion via `onFinish` prop from DetailSheet → App → passed as `setConfetti`.
- `ErrorBoundary` wraps the main tab content area and the lazy `DetailSheet` separately, so an error in one doesn't crash the other.
