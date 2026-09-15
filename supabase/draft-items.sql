-- Run this once on an existing Supabase project created before draft intake support.
alter table public.items alter column category_id drop not null;