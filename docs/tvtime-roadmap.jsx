import { useState } from "react";

const phases = [
  {
    id: 1,
    label: "Phase 1",
    title: "Foundation",
    duration: "Weeks 1–4",
    color: "#E8C547",
    accent: "#3D2E00",
    tasks: [
      { title: "Project Setup", desc: "Xcode project, SwiftUI structure, Git repo, folder architecture" },
      { title: "TMDB API Integration", desc: "API client, auth, show/season/episode endpoints, response models" },
      { title: "Core Data Schema", desc: "Show, Season, Episode, WatchedEntry, User entities + relationships" },
      { title: "Search & Browse UI", desc: "Search bar, results list, show detail screen with poster/metadata" },
    ],
  },
  {
    id: 2,
    label: "Phase 2",
    title: "Tracking Engine",
    duration: "Weeks 5–9",
    color: "#5BC4A0",
    accent: "#002D1F",
    tasks: [
      { title: "Episode-Level Tracking", desc: "Mark episodes watched, bulk-mark seasons, progress indicators per show" },
      { title: "Watchlist & Library", desc: "Currently watching, want to watch, completed — with sorting/filtering" },
      { title: "Watch History", desc: "Chronological log of watched episodes with timestamps" },
      { title: "Stats Dashboard", desc: "Total watch time, shows completed, episodes watched, genre breakdown" },
    ],
  },
  {
    id: 3,
    label: "Phase 3",
    title: "Auth & Sync",
    duration: "Weeks 10–13",
    color: "#7B8CDE",
    accent: "#0A0D2E",
    tasks: [
      { title: "Auth System", desc: "Sign up / login with email, Apple Sign-In, session management" },
      { title: "Backend Setup", desc: "Supabase or Firebase — users table, watched_episodes, lists" },
      { title: "Cloud Sync", desc: "Sync local Core Data to backend on login, conflict resolution strategy" },
      { title: "Multi-Device Support", desc: "Watch history + lists available across iPhone and iPad" },
    ],
  },
  {
    id: 4,
    label: "Phase 4",
    title: "Notifications & Discovery",
    duration: "Weeks 14–17",
    color: "#F28B6E",
    accent: "#2D0800",
    tasks: [
      { title: "Push Notifications", desc: "APNs setup, new episode alerts based on shows user is tracking" },
      { title: "Episode Air Date Scheduler", desc: "Backend cron job to check TMDB for upcoming episodes & trigger pushes" },
      { title: "Trending & Discover", desc: "Trending now, top-rated, genre browse using TMDB discover endpoint" },
      { title: "Ratings & Reviews", desc: "Star ratings + text reviews per show and episode" },
    ],
  },
  {
    id: 5,
    label: "Phase 5",
    title: "Social Layer",
    duration: "Weeks 18–24",
    color: "#D47DE8",
    accent: "#1A002D",
    tasks: [
      { title: "User Profiles", desc: "Public profile page — stats, pinned shows, recent activity" },
      { title: "Follow System", desc: "Follow/unfollow users, following/followers lists" },
      { title: "Activity Feed", desc: "See what people you follow are watching — real-time updates" },
      { title: "Lists & Sharing", desc: "Custom lists (e.g. 'Top 10 Dramas'), shareable via link or App Clip" },
      { title: "Share Profile", desc: "Shareable public profile link (e.g. nospoilers.io/u/username) showing stats, recent watches, and a follow button — requires adding a router (React Router)" },
    ],
  },
  {
    id: 6,
    label: "Phase 6",
    title: "Monetization & Launch",
    duration: "Weeks 25–28",
    color: "#E87A7A",
    accent: "#2D0000",
    tasks: [
      { title: "Freemium Model", desc: "Define free vs. paid tier — e.g. stats, themes, ad-free as premium" },
      { title: "StoreKit Integration", desc: "In-app subscription with weekly/annual options via StoreKit 2" },
      { title: "App Store Prep", desc: "Screenshots, App Preview video, metadata, keywords, privacy policy" },
      { title: "Launch & Analytics", desc: "TestFlight beta, crash reporting (Crashlytics), usage analytics" },
    ],
  },
  {
    id: 7,
    label: "Phase 7",
    title: "Mood Discovery",
    duration: "Weeks 29–33",
    color: "#F5A623",
    accent: "#2D1600",
    tasks: [
      { title: "Mood Taxonomy", desc: "Define mood categories (cozy, tense, heartwarming, mind-bending, etc.) and map each to TMDB genre/keyword/rating combos" },
      { title: "Mood Picker UI", desc: "Swipeable mood cards on a dedicated Discover screen — visually expressive, illustrated, one tap to browse results" },
      { title: "Mood-to-Query Engine", desc: "Backend logic translating mood + user watch history into a personalised TMDB discover query, filtering out already-watched titles" },
      { title: "Mood History & Favourites", desc: "Save moods the user browses so the app learns their patterns over time — feeds into future recommendations" },
      { title: "Shareable Mood Picks", desc: "Generate a shareable card: 'Feeling cozy tonight — Trackit recommends these 5 shows' with poster collage" },
    ],
  },
  {
    id: 8,
    label: "Phase 8",
    title: "Watch Parties",
    duration: "Weeks 34–40",
    color: "#7ED4C8",
    accent: "#00221F",
    tasks: [
      { title: "Party Rooms", desc: "Create or join a watch party room tied to a specific show/episode — persistent room with invite link" },
      { title: "Real-Time Sync", desc: "WebSocket-based presence layer — see who's in the room and their watch status (ready, watching, paused)" },
      { title: "Reaction Timeline", desc: "Tap emoji reactions during playback timestamped to episode runtime — visible to all party members after watching" },
      { title: "Episode Chat Thread", desc: "Spoiler-safe chat scoped per episode — unlocks fully after all members mark the episode watched" },
      { title: "Watch Party Notifications", desc: "Push alert when a friend starts a party for a show you're both tracking — one-tap join from notification" },
      { title: "Party History & Highlights", desc: "After a session, generate a recap: most reacted moment, funniest comment, who finished first" },
    ],
  },
];

export default function Roadmap() {
  const [active, setActive] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0C0C0F",
      fontFamily: "'Georgia', serif",
      padding: "48px 24px",
      color: "#F0EDE6",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        .phase-card {
          cursor: pointer;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .phase-card:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          transform: translateY(-2px);
        }
        .phase-card.open {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
        }
        .task-item {
          border-radius: 10px;
          padding: 14px 16px;
          background: rgba(0,0,0,0.25);
          border-left: 3px solid;
          transition: background 0.2s;
        }
        .task-item:hover {
          background: rgba(0,0,0,0.4);
        }
        .connector {
          width: 2px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.03));
          margin: 0 auto;
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "56px" }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 300,
          fontSize: "11px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(240,237,230,0.4)",
          marginBottom: "12px",
        }}>iOS App Development</p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 900,
          margin: 0,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          background: "linear-gradient(135deg, #F0EDE6 30%, rgba(240,237,230,0.4))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>TV Tracker Roadmap</h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 300,
          color: "rgba(240,237,230,0.45)",
          fontSize: "15px",
          marginTop: "14px",
        }}>8 phases · ~40 weeks · tap a phase to expand</p>
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {phases.map((phase, i) => (
          <div key={phase.id}>
            {/* Phase Card */}
            <div
              className={`phase-card ${active === phase.id ? "open" : ""}`}
              onClick={() => setActive(active === phase.id ? null : phase.id)}
            >
              {/* Header Row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "20px 24px",
              }}>
                {/* Phase number bubble */}
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: phase.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: phase.accent,
                }}>
                  {phase.id}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: phase.color,
                      fontWeight: 500,
                    }}>{phase.label}</span>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "11px",
                      color: "rgba(240,237,230,0.3)",
                    }}>{phase.duration}</span>
                  </div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#F0EDE6",
                    marginTop: "2px",
                  }}>{phase.title}</div>
                </div>

                {/* Expand icon */}
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "transform 0.3s",
                  transform: active === phase.id ? "rotate(45deg)" : "rotate(0deg)",
                  color: "rgba(240,237,230,0.5)",
                  fontSize: "18px",
                  fontWeight: 300,
                  lineHeight: 1,
                }}>+</div>
              </div>

              {/* Expanded Tasks */}
              {active === phase.id && (
                <div style={{
                  padding: "0 24px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}>
                  {phase.tasks.map((task, ti) => (
                    <div
                      key={ti}
                      className="task-item"
                      style={{ borderLeftColor: phase.color }}
                    >
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: "14px",
                        color: "#F0EDE6",
                        marginBottom: "4px",
                      }}>{task.title}</div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 300,
                        fontSize: "13px",
                        color: "rgba(240,237,230,0.5)",
                        lineHeight: 1.5,
                      }}>{task.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connector between phases */}
            {i < phases.length - 1 && (
              <div className="connector" style={{ height: "28px" }} />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center",
        marginTop: "56px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "12px",
        color: "rgba(240,237,230,0.2)",
        letterSpacing: "0.1em",
      }}>
        TMDB API · SwiftUI · Supabase · APNs · StoreKit 2 · WebSockets
      </div>
    </div>
  );
}
