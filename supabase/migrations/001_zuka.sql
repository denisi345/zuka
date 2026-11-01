sql
create table profiles (id uuid primary key, username text);
create table posts (id uuid primary key default gen_random_uuid(), content text, user_id uuid, created_at timestamp default now());
create table reels (id uuid primary key default gen_random_uuid(), video_url text, user_id uuid, likes int default 0);
create table marketplace (id uuid primary key default gen_random_uuid(), title text, price float);
