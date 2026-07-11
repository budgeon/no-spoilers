# No Spoilers

Track TV shows and movies with your community — no spoilers guaranteed.

Built with React + Vite. Cream background, dusty blue accents, TV Time-inspired layout with bottom tab navigation.

---

## Features

**Tracking**
- Episode-level tracking with per-season tabs and progress bars
- Mark full titles or individual episodes as watched
- Watchlist with star button on every poster
- Confetti when you finish a show

**Discovery**
- Trending TV and Movies
- Top Rated rows
- Genre filter chips
- New This Week — currently airing shows
- Upcoming Episodes calendar grouped by air date

**Community**
- Episode-level comment threads
- Emoji reactions (😂 😭 🤯 ❤️ 😱 🔥 👏 💀)
- Spoiler blur with tap-to-reveal
- Like comments, delete your own

**Profile & Stats**
- Days watched hero stat
- Genre breakdown and rating distribution charts

**Auth**
- Email + password sign up / sign in
- Mock Google Sign-In
- Persisted via localStorage (Supabase-ready)

**Import**
- TV Time GDPR data importer (`tracking-prod-records-v2.csv`)
- Deadline: July 15, 2026

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/no-spoilers.git
cd no-spoilers
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your TMDB API key

A `.env` file is included for local development. To use your own key:

1. Sign up free at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
2. Edit `.env`:

```
VITE_TMDB_API_KEY=your_key_here
```

### 4. Run locally

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel

### Step 1 — Push to GitHub

If you're starting fresh:

```bash
git init
git add .
git commit -m "Initial commit — No Spoilers v1.0"
gh repo create no-spoilers --public --source=. --push
```

Without the GitHub CLI:

```bash
git init
git add .
git commit -m "Initial commit — No Spoilers v1.0"
git remote add origin https://github.com/YOUR_USERNAME/no-spoilers.git
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your GitHub repo
3. Vercel auto-detects Vite — framework settings are correct by default
4. Under **Environment Variables**, add:
   - Name: `VITE_TMDB_API_KEY`
   - Value: your TMDB API key
5. Click **Deploy**

Your app will be live at `https://no-spoilers.vercel.app` (or similar) within 60 seconds. Every push to `main` redeploys automatically.

> ⚠️ Never commit your `.env` file to GitHub — it's already excluded in `.gitignore`. Always set secrets via Vercel's Environment Variables panel.

---

## Deploying to Netlify (alternative)

```bash
npm run build
```

Drag the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop), then add `VITE_TMDB_API_KEY` under Site Settings → Environment Variables → Trigger Redeploy.

---

## Project structure

```
no-spoilers/
├── src/
│   ├── App.jsx        # Full app — single file for now
│   └── main.jsx       # React entry point
├── public/
│   └── favicon.svg    # NS initials, dusty blue
├── index.html
├── vite.config.js
├── package.json
├── .env               # Local API key — never commit
├── .env.example       # Template for contributors
└── .gitignore
```

---

## Upgrading to real auth (Supabase)

The `Auth` object in `App.jsx` is a mock that swaps out cleanly:

```bash
npm install @supabase/supabase-js
```

Add to `.env`:
```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Replace `Auth` methods:
| Mock | Supabase |
|---|---|
| `Auth.signup(name, email, pw)` | `supabase.auth.signUp({ email, password })` |
| `Auth.login(email, pw)` | `supabase.auth.signInWithPassword({ email, password })` |
| `Auth.google()` | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| `Auth.logout()` | `supabase.auth.signOut()` |

Then replace `localStorage` with a `watched_episodes` Supabase table for cross-device sync.

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| 1–2 | Core tracking, search, episodes, stats | ✅ Done |
| 3 | Auth (mock), localStorage persistence | ✅ Done |
| 4 | Calendar, trending, top rated, comments, TV Time import | ✅ Done |
| 3 | Real auth via Supabase | 🔜 Next |
| 5 | Social — follow, activity feed, lists | 🔜 Planned |
| 6 | Monetisation UI, affiliate links | 🔜 Planned |
| 7 | Mood discovery | 🔜 Planned |
| 8 | Watch parties (WebSockets) | 🔜 Planned |

---

## Tech stack

- **React 18** + **Vite 5**
- **TMDB API** — media data, images, episode schedules
- **localStorage** — data persistence (Supabase when ready)
- **No UI library** — fully custom, all inline styles

---

## License

MIT
