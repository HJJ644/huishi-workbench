import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";

export interface SyncPayload {
  orders: unknown[];
  products: unknown[];
  feeGroups: unknown[];
  basicInfo: unknown;
  userProfile: { nickname: string; bio: string };
  updatedAt: string;
}

/** 从应用状态中提取需要同步的数据 */
export function buildSyncPayload(state: {
  orders: unknown[];
  products: unknown[];
  feeGroups: unknown[];
  basicInfo: unknown;
  userProfile: { nickname: string; bio: string };
}): SyncPayload {
  return {
    orders: state.orders,
    products: state.products,
    feeGroups: state.feeGroups,
    basicInfo: state.basicInfo,
    userProfile: state.userProfile,
    updatedAt: new Date().toISOString(),
  };
}

/** 在 Supabase SQL Editor 中执行一次即可（复制本 SQL 到 SQL Editor 运行） */
export const SETUP_SQL = `-- 云同步数据表
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

drop policy if exists "own data select" on public.user_data;
create policy "own data select" on public.user_data
  for select using (auth.uid() = user_id);

drop policy if exists "own data insert" on public.user_data;
create policy "own data insert" on public.user_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "own data update" on public.user_data;
create policy "own data update" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);`;

async function client() {
  return await getSupabaseClient();
}

// ---------- 认证 ----------

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await (await client()).auth.signUp({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await (await client()).auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function signOutUser() {
  const { error } = await (await client()).auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSessionUser(): Promise<User | null> {
  const { data } = await (await client()).auth.getSession();
  return data.session?.user ?? null;
}

export async function onAuthChange(cb: (user: User | null) => void) {
  const supabase = await client();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ?? null);
  });
  return data.subscription;
}

// ---------- 数据读写 ----------

function rowFor(user: User, payload: SyncPayload) {
  return { user_id: user.id, data: payload, updated_at: new Date().toISOString() };
}

export async function uploadUserData(user: User, payload: SyncPayload) {
  const { error } = await (await client())
    .from("user_data")
    .upsert(rowFor(user, payload), { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

export async function downloadUserData(user: User): Promise<SyncPayload | null> {
  const { data, error } = await (await client())
    .from("user_data")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.data ?? null;
}

// ---------- 合并决策 ----------

export type MergeAction = "upload" | "download" | "conflict" | "skip";

/** 本地是否可视为空（没有任何订单） */
export function isLocalEmpty(localOrders: unknown[]) {
  return localOrders.length === 0;
}

export function decideMerge(
  localOrders: unknown[],
  cloud: SyncPayload | null
): MergeAction {
  if (!cloud) return "upload"; // 云端没有数据 → 备份本地
  const cloudOrders = cloud.orders ?? [];
  if (localOrders.length === 0 && cloudOrders.length === 0) return "skip";
  if (localOrders.length === 0) return "download"; // 本地空 → 拉取云端
  if (cloudOrders.length === 0) return "upload"; // 云端空 → 上传本地
  return "conflict"; // 两边都有数据 → 让用户选择
}
