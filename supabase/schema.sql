-- 深A女性向大学 · 课程互动后端（Supabase）
-- 在 Supabase 控制台 → SQL Editor 粘贴整段 → Run 即可。
-- 课程目录本身放在 content/courses.json（CMS 编辑）；这里只存跨用户的互动数据。

-- 评论：匿名、纯文本、限长
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  course_id  text not null,
  body       text not null check (char_length(body) between 1 and 500),
  anon_id    text not null,
  created_at timestamptz not null default now()
);

-- 评分：每设备每课一条（可改），五星制
create table if not exists public.ratings (
  course_id  text not null,
  anon_id    text not null,
  stars      int  not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (course_id, anon_id)
);

-- 打卡：每设备每课一次
create table if not exists public.checkins (
  course_id  text not null,
  anon_id    text not null,
  created_at timestamptz not null default now(),
  primary key (course_id, anon_id)
);

alter table public.comments enable row level security;
alter table public.ratings  enable row level security;
alter table public.checkins enable row level security;

-- 公开读
create policy "read comments" on public.comments for select using (true);
create policy "read ratings"  on public.ratings  for select using (true);
create policy "read checkins" on public.checkins for select using (true);

-- 公开写（匿名）。评论只能插入不能改删（审核由你在 Supabase 后台做）
create policy "insert comments" on public.comments for insert with check (true);
create policy "insert ratings"  on public.ratings  for insert with check (true);
create policy "update ratings"  on public.ratings  for update using (true) with check (true);
create policy "insert checkins" on public.checkins for insert with check (true);

-- 统计：一次拿到某课的 打卡数 / 评论数 / 评分数 / 平均分
create or replace function public.course_stats(cid text)
returns table (checkin_count bigint, comment_count bigint, rating_count bigint, rating_avg numeric)
language sql stable as $$
  select
    (select count(*) from public.checkins where course_id = cid),
    (select count(*) from public.comments where course_id = cid),
    (select count(*) from public.ratings  where course_id = cid),
    (select round(avg(stars)::numeric, 1) from public.ratings where course_id = cid);
$$;
grant execute on function public.course_stats(text) to anon;
