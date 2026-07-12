import { supabase } from "./supabase.js";
import { LS, SK } from "../constants/storage.js";

export async function fetchProfile(userId) {
  const { data } = await supabase.from("profiles").select("id, name, avatar, created_at").eq("id", userId).single();
  return data ? { id: data.id, name: data.name, avatar: data.avatar, joinedAt: data.created_at } : null;
}

export async function updateProfile(userId, { name, avatar }) {
  await supabase.from("profiles").update({ name, avatar }).eq("id", userId);
}

async function fetchAllPages(buildQuery) {
  const PAGE = 1000;
  let rows = [], from = 0;
  while (true) {
    const { data } = await buildQuery(from, from + PAGE - 1);
    if (!data?.length) break;
    rows = rows.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

export async function loadUserData(userId) {
  const [wiRows, wlRows, rRows, weRows, epRows] = await Promise.all([
    fetchAllPages((from, to) => supabase.from("watched_items").select("*").eq("user_id", userId).range(from, to)),
    fetchAllPages((from, to) => supabase.from("watchlist_items").select("*").eq("user_id", userId).range(from, to)),
    fetchAllPages((from, to) => supabase.from("ratings").select("*").eq("user_id", userId).range(from, to)),
    fetchAllPages((from, to) => supabase.from("watched_episodes").select("*").eq("user_id", userId).range(from, to)),
    fetchAllPages((from, to) => supabase.from("ep_totals").select("*").range(from, to)),
  ]);
  const watched = {};
  wiRows.forEach(row => { watched[row.item_key] = { id: row.item_id, tmdbId: row.tmdb_id, type: row.media_type, name: row.name, poster_path: row.poster_path, genre_ids: row.genre_ids || [], vote_average: row.vote_average || 0, watchedAt: new Date(row.watched_at).getTime(), importedFrom: row.imported_from }; });
  weRows.forEach(row => { watched[row.episode_key] = { epId: row.ep_tmdb_id, showId: row.show_id, watchedAt: new Date(row.watched_at).getTime(), importedFrom: row.imported_from }; });
  const watchlist = {};
  wlRows.forEach(row => { watchlist[row.item_key] = { id: row.item_id, type: row.media_type, name: row.name, poster_path: row.poster_path, genre_ids: row.genre_ids || [], vote_average: row.vote_average || 0, addedAt: new Date(row.added_at).getTime(), item: row.item_data, importedFrom: row.imported_from }; });
  const ratings = {};
  rRows.forEach(row => { ratings[row.item_key] = row.rating; });
  const epTotals = {};
  epRows.forEach(row => { epTotals[row.show_id] = row.total_episodes; });
  return { watched, watchlist, ratings, epTotals };
}

export async function upsertWatchedItem(userId, key, item) {
  await supabase.from("watched_items").upsert({ user_id: userId, item_key: key, item_id: String(item.id), media_type: item.type, tmdb_id: item.tmdbId || null, name: item.name, poster_path: item.poster_path || null, genre_ids: item.genre_ids || [], vote_average: item.vote_average || 0, watched_at: new Date(item.watchedAt || Date.now()).toISOString(), imported_from: item.importedFrom || null }, { onConflict: "user_id,item_key" });
}

export async function deleteWatchedItem(userId, key) {
  await supabase.from("watched_items").delete().eq("user_id", userId).eq("item_key", key);
}

export async function upsertWatchedEpisode(userId, key, data) {
  const snMatch = key.match(/_s(\d+)e(\d+)$/);
  await supabase.from("watched_episodes").upsert({ user_id: userId, episode_key: key, show_id: String(data.showId), season_number: snMatch ? parseInt(snMatch[1]) : null, episode_number: snMatch ? parseInt(snMatch[2]) : null, ep_tmdb_id: data.epId || null, watched_at: new Date(data.watchedAt || Date.now()).toISOString(), imported_from: data.importedFrom || null }, { onConflict: "user_id,episode_key" });
}

export async function deleteWatchedEpisode(userId, key) {
  await supabase.from("watched_episodes").delete().eq("user_id", userId).eq("episode_key", key);
}

export async function upsertWatchlistItem(userId, key, item) {
  await supabase.from("watchlist_items").upsert({ user_id: userId, item_key: key, item_id: String(item.id), media_type: item.type, tmdb_id: item.tmdbId || null, name: item.name, poster_path: item.poster_path || null, genre_ids: item.genre_ids || item.item?.genre_ids || [], vote_average: item.vote_average || item.item?.vote_average || 0, added_at: new Date(item.addedAt || Date.now()).toISOString(), imported_from: item.importedFrom || null, item_data: item.item || null }, { onConflict: "user_id,item_key" });
}

export async function deleteWatchlistItem(userId, key) {
  await supabase.from("watchlist_items").delete().eq("user_id", userId).eq("item_key", key);
}

export async function upsertRating(userId, key, value) {
  await supabase.from("ratings").upsert({ user_id: userId, item_key: key, rating: value }, { onConflict: "user_id,item_key" });
}

export async function deleteRating(userId, key) {
  await supabase.from("ratings").delete().eq("user_id", userId).eq("item_key", key);
}

export async function upsertEpTotal(showId, total) {
  await supabase.from("ep_totals").upsert({ show_id: String(showId), total_episodes: total, updated_at: new Date().toISOString() }, { onConflict: "show_id" });
}

export async function loadComments(showId, epTmdbId) {
  let q = supabase.from("comments").select("*, profiles(name, avatar)").eq("show_id", String(showId));
  q = epTmdbId != null ? q.eq("ep_tmdb_id", epTmdbId) : q.is("ep_tmdb_id", null);
  const { data } = await q.order("created_at", { ascending: false }).limit(200);
  return (data || []).map(c => ({ id: c.id, userId: c.user_id, userName: c.profiles?.name || "Unknown", avatar: c.profiles?.avatar || "🎬", text: c.text, reaction: c.reaction, spoiler: c.spoiler, likes: (c.liked_by || []).length, likedBy: c.liked_by || [], createdAt: new Date(c.created_at).getTime() }));
}

export async function postComment(userId, showId, epTmdbId, { text, reaction, spoiler }) {
  await supabase.from("comments").insert({ user_id: userId, show_id: String(showId), ep_tmdb_id: epTmdbId ?? null, text: text || "", reaction: reaction || null, spoiler: spoiler || false, liked_by: [] });
}

export async function deleteComment(commentId) {
  await supabase.from("comments").delete().eq("id", commentId);
}

export async function toggleCommentLike(commentId, userId, currentLikedBy) {
  const likedBy = currentLikedBy || [];
  const newLikedBy = likedBy.includes(userId) ? likedBy.filter(id => id !== userId) : [...likedBy, userId];
  await supabase.from("comments").update({ liked_by: newLikedBy }).eq("id", commentId);
  return newLikedBy;
}

// ─── SOCIAL ───────────────────────────────────────────────────────────────

export async function followUser(followerId, followingId) {
  await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
}

export async function unfollowUser(followerId, followingId) {
  await supabase.from("follows").delete()
    .eq("follower_id", followerId).eq("following_id", followingId);
}

export async function isFollowing(followerId, followingId) {
  const { data } = await supabase.from("follows").select("follower_id")
    .eq("follower_id", followerId).eq("following_id", followingId).maybeSingle();
  return !!data;
}

export async function fetchFollowing(userId) {
  const { data } = await supabase.from("follows")
    .select("following_id, profiles!follows_following_id_fkey(id, name, avatar, created_at)")
    .eq("follower_id", userId).limit(500);
  return (data || []).map(r => ({ id: r.profiles.id, name: r.profiles.name, avatar: r.profiles.avatar, joinedAt: r.profiles.created_at }));
}

export async function fetchFollowers(userId) {
  const { data } = await supabase.from("follows")
    .select("follower_id, profiles!follows_follower_id_fkey(id, name, avatar, created_at)")
    .eq("following_id", userId).limit(500);
  return (data || []).map(r => ({ id: r.profiles.id, name: r.profiles.name, avatar: r.profiles.avatar, joinedAt: r.profiles.created_at }));
}

export async function fetchFollowCounts(userId) {
  const [fing, fers] = await Promise.all([
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", userId),
    supabase.from("follows").select("follower_id",  { count: "exact", head: true }).eq("following_id", userId),
  ]);
  return { following: fing.count || 0, followers: fers.count || 0 };
}

export async function searchProfiles(query, currentUserId, limit = 20) {
  if (!query.trim()) return [];
  const { data } = await supabase.from("profiles")
    .select("id, name, avatar, created_at")
    .ilike("name", `%${query}%`)
    .neq("id", currentUserId)
    .limit(limit);
  return (data || []).map(r => ({ id: r.id, name: r.name, avatar: r.avatar, joinedAt: r.created_at }));
}

export async function fetchPublicProfileStats(userId) {
  const [tvCount, mvCount, epCount] = await Promise.all([
    supabase.from("watched_items").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("media_type", "tv"),
    supabase.from("watched_items").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("media_type", "movie"),
    supabase.from("watched_episodes").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  return {
    shows:    tvCount.count ?? 0,
    movies:   mvCount.count ?? 0,
    episodes: epCount.count ?? 0,
  };
}

export async function fetchActivityFeed(userId, limit = 50) {
  const { data: followRows } = await supabase.from("follows")
    .select("following_id").eq("follower_id", userId).limit(500);
  const followedIds = (followRows || []).map(r => r.following_id);
  if (!followedIds.length) return [];

  const [wi, we] = await Promise.all([
    supabase.from("watched_items")
      .select("user_id, item_key, item_id, media_type, name, poster_path, watched_at, profiles(name, avatar)")
      .in("user_id", followedIds).order("watched_at", { ascending: false }).limit(limit),
    supabase.from("watched_episodes")
      .select("user_id, episode_key, show_id, season_number, episode_number, watched_at, profiles(name, avatar)")
      .in("user_id", followedIds).order("watched_at", { ascending: false }).limit(limit),
  ]);

  const showNameMap = {};
  (wi.data || []).forEach(r => {
    if (r.media_type === "tv") showNameMap[`${r.user_id}:${r.item_id}`] = r.name;
  });

  const items = [
    ...(wi.data || []).map(r => ({
      type: r.media_type === "tv" ? "show" : "movie",
      userId: r.user_id, userName: r.profiles?.name || "Unknown", avatar: r.profiles?.avatar || "🎬",
      name: r.name, poster_path: r.poster_path, itemKey: r.item_key, itemId: r.item_id,
      showId: null, season: null, episode: null,
      watchedAt: new Date(r.watched_at).getTime(),
    })),
    ...(we.data || []).map(r => ({
      type: "episode",
      userId: r.user_id, userName: r.profiles?.name || "Unknown", avatar: r.profiles?.avatar || "🎬",
      name: null, poster_path: null, itemKey: r.episode_key, itemId: null,
      showId: r.show_id, season: r.season_number, episode: r.episode_number,
      showName: showNameMap[`${r.user_id}:${r.show_id}`] || null,
      watchedAt: new Date(r.watched_at).getTime(),
    })),
  ];

  return items.sort((a, b) => b.watchedAt - a.watchedAt).slice(0, limit);
}

const CHUNK = 500;
const chunkArr = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

export async function bulkImport(userId, { watchedItems, watchedEpisodes, watchlistItems, epTotals, ratings }) {
  const ops = [];
  if (watchedItems?.length) for (const ch of chunkArr(watchedItems, CHUNK)) ops.push(supabase.from("watched_items").upsert(ch.map(r => ({ ...r, user_id: userId })), { onConflict: "user_id,item_key" }));
  if (watchedEpisodes?.length) for (const ch of chunkArr(watchedEpisodes, CHUNK)) ops.push(supabase.from("watched_episodes").upsert(ch.map(r => ({ ...r, user_id: userId })), { onConflict: "user_id,episode_key" }));
  if (watchlistItems?.length) for (const ch of chunkArr(watchlistItems, CHUNK)) ops.push(supabase.from("watchlist_items").upsert(ch.map(r => ({ ...r, user_id: userId })), { onConflict: "user_id,item_key" }));
  if (ratings?.length) for (const ch of chunkArr(ratings, CHUNK)) ops.push(supabase.from("ratings").upsert(ch.map(r => ({ ...r, user_id: userId })), { onConflict: "user_id,item_key" }));
  if (epTotals) {
    const epArr = Object.entries(epTotals).map(([showId, total]) => ({ show_id: String(showId), total_episodes: total, updated_at: new Date().toISOString() }));
    for (const ch of chunkArr(epArr, CHUNK)) ops.push(supabase.from("ep_totals").upsert(ch, { onConflict: "show_id" }));
  }
  await Promise.all(ops);
}

export function watchedToRows(nw) {
  const watchedItems = [], watchedEpisodes = [];
  Object.entries(nw).forEach(([k, v]) => {
    if (k.startsWith("ep_")) {
      const snMatch = k.match(/_s(\d+)e(\d+)$/);
      watchedEpisodes.push({ episode_key: k, show_id: String(v.showId), season_number: snMatch ? parseInt(snMatch[1]) : null, episode_number: snMatch ? parseInt(snMatch[2]) : null, ep_tmdb_id: v.epId || null, watched_at: new Date(v.watchedAt || Date.now()).toISOString(), imported_from: v.importedFrom || null });
    } else {
      watchedItems.push({ item_key: k, item_id: String(v.id), media_type: v.type, tmdb_id: v.tmdbId || null, name: v.name, poster_path: v.poster_path || null, genre_ids: v.genre_ids || [], vote_average: v.vote_average || 0, watched_at: new Date(v.watchedAt || Date.now()).toISOString(), imported_from: v.importedFrom || null });
    }
  });
  return { watchedItems, watchedEpisodes };
}

export function watchlistToRows(nwl) {
  return Object.entries(nwl).map(([k, v]) => ({ item_key: k, item_id: String(v.id), media_type: v.type, name: v.name, poster_path: v.poster_path || null, genre_ids: v.genre_ids || v.item?.genre_ids || [], vote_average: v.vote_average || v.item?.vote_average || 0, added_at: new Date(v.addedAt || Date.now()).toISOString(), imported_from: v.importedFrom || null, item_data: v.item || null }));
}

export async function migrateLocalStorage(userId) {
  if (localStorage.getItem("tt_migrated")) return;
  const nw = LS.get(SK.W, {}), nwl = LS.get(SK.WL, {}), ratingsObj = LS.get(SK.R, {}), epTotals = LS.get(SK.EP, {});
  const { watchedItems, watchedEpisodes } = watchedToRows(nw);
  const watchlistItems = watchlistToRows(nwl);
  const ratings = Object.entries(ratingsObj).map(([k, v]) => ({ item_key: k, rating: v }));
  await bulkImport(userId, { watchedItems, watchedEpisodes, watchlistItems, epTotals, ratings });
  localStorage.setItem("tt_migrated", "1");
}
