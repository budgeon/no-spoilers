# Delete all TV show data for a single user

Replace `'USER_ID_HERE'` with the user's UUID from the Supabase Auth → Users table.

## 1. Watched TV shows

```sql
DELETE FROM watched_items
WHERE user_id = 'USER_ID_HERE'
  AND media_type = 'tv';
```

## 2. Watched episodes (all episodes belong to TV shows)

```sql
DELETE FROM watched_episodes
WHERE user_id = 'USER_ID_HERE';
```

## 3. Watchlisted TV shows

```sql
DELETE FROM watchlist_items
WHERE user_id = 'USER_ID_HERE'
  AND media_type = 'tv';
```

## 4. Ratings for TV shows

```sql
DELETE FROM ratings
WHERE user_id = 'USER_ID_HERE'
  AND item_key LIKE 'tv_%';
```

## 5. Episode totals (optional)

`ep_totals` has no `user_id` — it's a global lookup table shared across all users. Only delete rows here if you're cleaning up TV Time synthetic IDs that no other user will reference.

```sql
-- Only run this if the show IDs were imported from TV Time
-- and no other user has watched the same shows.
DELETE FROM ep_totals
WHERE show_id IN (
  SELECT DISTINCT show_id
  FROM watched_episodes
  WHERE user_id = 'USER_ID_HERE'
);
```

> **Run steps 1–4 first**, then optionally run step 5.
> Step 5 becomes a no-op if you already deleted watched_episodes in step 2 (the subquery returns nothing),
> so if you need it, derive the show_id list before running step 2.
