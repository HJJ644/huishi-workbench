import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_CONFIG_KEY = "huishi-supabase-config";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SupabaseConfig;
    if (!parsed.url || !parsed.anonKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
}

export function clearSupabaseConfig() {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
}

let cachedClient: SupabaseClient | null = null;
let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * 按需加载 Supabase SDK：SDK 体积较大，只有真正用到云同步时才动态载入，
 * 避免拖慢首屏。未配置云端信息时不会触发下载。
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (cachedClient) return cachedClient;
  if (clientPromise) return clientPromise;

  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("未配置云端服务，请先在设置页填写 Supabase 项目地址与密钥");
  }

  clientPromise = import("@supabase/supabase-js").then(({ createClient }) => {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return cachedClient;
  });

  return clientPromise;
}

export function resetSupabaseClient() {
  cachedClient = null;
}
