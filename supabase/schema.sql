-- 绘事工作台 · Supabase 数据库 schema（方案 B：时间戳合并同步）
-- 在 Supabase 后台 → SQL Editor → 粘贴全部内容运行即可。
-- 表均为 jsonb 整存，与现有 localStorage 结构 1:1 对应，迁移成本最低。

-- ============ 1. 扩展 ============
create extension if not exists "pgcrypto";

-- ============ 2. 用户档案（关联 auth.users） ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

-- ============ 3. 核心业务表（orders / templates / clients / app_state） ============
-- 设计约定：每个「逻辑集合」一行，data 为整包 jsonb，updated_at 用于冲突比对。
create table if not exists public.orders (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.templates (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.clients (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- 零散状态：费用设置、小票配置、主题等，按 key 分多行
create table if not exists public.app_state (
  user_id uuid references auth.users(id) on delete cascade,
  key text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

-- ============ 4. 自动化 updated_at ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders on public.orders;
create trigger trg_orders before update on public.orders
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_templates on public.templates;
create trigger trg_templates before update on public.templates
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_clients on public.clients;
create trigger trg_clients before update on public.clients
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_app_state on public.app_state;
create trigger trg_app_state before update on public.app_state
  for each row execute function public.touch_updated_at();

-- 新用户自动建 profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists trg_new_user on auth.users;
create trigger trg_new_user after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ 5. RLS 行级隔离（关键安全项） ============
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.templates enable row level security;
alter table public.clients enable row level security;
alter table public.app_state enable row level security;

-- 任意登录用户只可读写自己的行
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own orders" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own templates" on public.templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own clients" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own app_state" on public.app_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
