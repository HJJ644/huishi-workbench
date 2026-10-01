-- ============================================================
-- 小羊星 · 云同步付费方案 A（会员码手动开通）
-- 用法：Supabase Dashboard → SQL Editor → New query → 粘贴全部 → Run
--
-- 生效逻辑：
--   1. profiles 表加 is_pro 字段（默认 false）
--   2. 云端 4 张数据表的 RLS 策略改为「本人 且 is_pro = true」才可读写
--      → 未开通会员即使改前端代码，云端读写也会被数据库直接拒绝
--   3. 开通方式：用户付款后，你在 Table Editor → profiles
--      找到该用户（看 email 列）→ 把 is_pro 勾选为 true，立即生效
--
-- ⚠️ 跑完这份 SQL 后，你自己的账号也要去 Table Editor → profiles
--    把 is_pro 置为 true，否则你自己的云同步也会被拦。
-- ============================================================

-- 1) profiles 加 is_pro 字段
alter table public.profiles
  add column if not exists is_pro boolean not null default false;

-- 2) 删除旧的「本人即可读写」策略，换成「本人 且 已开通」
drop policy if exists "own orders" on public.orders;
create policy "pro orders" on public.orders
  for all using (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_pro))
  with check (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_pro));

drop policy if exists "own templates" on public.templates;
create policy "pro templates" on public.templates
  for all using (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_pro))
  with check (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_pro));

drop policy if exists "own clients" on public.clients;
create policy "pro clients" on public.clients
  for all using (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_pro))
  with check (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_pro));

drop policy if exists "own app_state" on public.app_state;
create policy "pro app_state" on public.app_state
  for all using (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_pro))
  with check (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_pro));

-- 3) profiles：本人可读（前端拉 is_pro 用）。保留原 "own profile" 策略即可
--    （它允许本人读写 profiles 行，但普通用户端不会改 is_pro；
--     站长开通走 Dashboard 的 service role，不受 RLS 限制）
drop policy if exists "own profile" on public.profiles;
create policy "self read profile" on public.profiles
  for select using (auth.uid() = id);
