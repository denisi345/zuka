sql
-- ZUKA Reels, Likes, Comments - 002

create table if not exists reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  video_url text,
  caption text,
  likes_count int default 0,
  created_at timestamptz default now()
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  post_id uuid references public.posts(id) on delete cascade,
  reel_id uuid references reels(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  post_id uuid references public.posts(id) on delete cascade,
  content text,
  created_at timestamptz default now()
);

-- Enable RLS for security
alter table reels enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;

-- Allow all for now (you will restrict later)
create policy "allow all" on reels for all using (true) with check (true);
create policy "allow all" on likes for all using (true) with check (true);
create policy "allow all" on comments for all using (true) with check (true);
