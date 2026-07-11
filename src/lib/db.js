import { supabase } from "./supabase.js";
import { LS, SK } from "../constants/storage.js";

export async function fetchProfile(userId) {
  const { data } = await supabase.from("profiles").select("id, name, avatar").eq("id", userId).single();
  return data ? { id: data.id, name: data.name, avatar: data.avatar } : null;
}

export async function loadUserData(userId) {
  const [wi, we, wl, r, ep] = await Promise.all([
    supabase.from("watched_items").select("*").eq("user_id", userId),
    supabase.from("watched_episodes").select("*").eq("user_id", userId),
    supabase.from("watchlist_items").select("*").eq("user_id", userId),
    supabase.from("ratings").select("*").eq("user_id", userId),
    supabase.from("ep_totals").select("*"),
  ]);
  const watched = {};
  wi.data?.forEach(row => { watched[row.item_key] = { id: row.item_id, type: row.media_type, name: row.name, poster_path: row.poster_path, genre_ids: row.genre_ids || [], vote_average: row.vote_average || 0, watchedAt: new Date(row.watched_at).getTime(), importedFrom: row.imported_from }; });
  we.data?.forEach(row => { watched[row.episode_key] = { epId: row.ep_tmdb_id, showId: row.show_id, watchedAt: new Date(row.watched_at).getTime(), importedFrom: row.imported_from }; });
  const watchlist = {};
  wl.data?.forEach(row => { watchlist[row.item_key] = { id: row.item_id, type: row.media_type, name: row.name, poster_path: row.poster_path, genre_ids: row.genre_ids || [], vote_average: row.vote_average || 0, addedAt: new Date(row.added_at).getTime(), item: row.item_data, importedFrom: row.imported_from }; });
  const ratings = {};
  r.data?.forEach(row => { ratings[row.item_key] = row.rating; });
  const epTotals = {};
  ep.data?.forEach(row => { epTotals[row.show_id] = row.total_episodes; });
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

export async function upsertEpTotal(showId, total) {
  await supabase.from("ep_totals").upsert({ show_id: String(showId), total_episodes: total, updated_at: new Date().toISOString() }, { onConflict: "show_id" });
}

export async function loadComments(showId, epTmdbId) {
  const { data } = await supabase.from("comments").select("*, profiles(name, avatar)").eq("show_id", String(showId)).eq("ep_tmdb_id", epTmdbId).order("created_at", { ascending: false });
  return (data || []).map(c => ({ id: c.id, userId: c.user_id, userName: c.profiles?.name || "Unknown", avatar: c.profiles?.avatar || "🎬", text: c.text, reaction: c.reaction, spoiler: c.spoiler, likes: (c.liked_by || []).length, likedBy: c.liked_by || [], createdAt: new Date(c.created_at).getTime() }));
}

export async function postComment(userId, showId, epTmdbId, { text, reaction, spoiler }) {
  await supabase.from("comments").insert({ user_id: userId, show_id: String(showId), ep_tmdb_id: epTmdbId, text: text || "", reaction: reaction || null, spoiler: spoiler || false, liked_by: [] });
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
      watchedItems.push({ item_key: k, item_id: String(v.id), media_type: v.type, name: v.name, poster_path: v.poster_path || null, genre_ids: v.genre_ids || [], vote_average: v.vote_average || 0, watched_at: new Date(v.watchedAt || Date.now()).toISOString(), imported_from: v.importedFrom || null });
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
