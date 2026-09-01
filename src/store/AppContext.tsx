import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Order, Product, FeeGroup, BasicInfo, AuthState } from "../types";
import {
  initialOrders,
  initialProducts,
  initialFeeGroups,
  initialBasicInfo,
} from "../data/initialData";
import {
  buildSyncPayload,
  uploadUserData,
  downloadUserData,
  getSessionUser,
  decideMerge,
  type MergeAction,
} from "../lib/cloudSync";
import { getSupabaseConfig } from "../lib/supabase";

export interface UserProfile {
  nickname: string;
  bio: string;
}

interface ToastState {
  message: string;
  visible: boolean;
}

interface AppState {
  orders: Order[];
  products: Product[];
  feeGroups: FeeGroup[];
  cloudSync: boolean;
  darkMode: boolean;
  sidebarCollapsed: boolean;
  userProfile: UserProfile;
  basicInfo: BasicInfo;
  auth: AuthState;
  toast: ToastState;
}

type Action =
  | { type: "SET_ORDERS"; payload: Order[] }
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER"; payload: Order }
  | { type: "DELETE_ORDER"; payload: string }
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: string }
  | { type: "SET_FEE_GROUPS"; payload: FeeGroup[] }
  | { type: "SET_CLOUD_SYNC"; payload: boolean }
  | { type: "SET_DARK_MODE"; payload: boolean }
  | { type: "SET_SIDEBAR_COLLAPSED"; payload: boolean }
  | { type: "SET_USER_PROFILE"; payload: UserProfile }
  | { type: "SET_BASIC_INFO"; payload: BasicInfo }
    | { type: "SET_AUTH"; payload: AuthState }
    | { type: "SHOW_TOAST"; payload: string }
    | { type: "HIDE_TOAST" }
    | { type: "HYDRATE"; payload: Partial<AppState> };

const initialState: AppState = {
  orders: initialOrders,
  products: initialProducts,
  feeGroups: initialFeeGroups,
  cloudSync: false,
  darkMode: false,
  sidebarCollapsed: false,
    userProfile: { nickname: "小绘", bio: "" },
    basicInfo: initialBasicInfo,
    auth: { isAuthenticated: false },
    toast: { message: "", visible: false },
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_ORDERS":
      return { ...state, orders: action.payload };
    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.payload] };
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o
        ),
      };
    case "DELETE_ORDER":
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.payload),
      };
    case "SET_PRODUCTS":
      return { ...state, products: action.payload };
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case "SET_FEE_GROUPS":
      return { ...state, feeGroups: action.payload };
    case "SET_CLOUD_SYNC":
      return { ...state, cloudSync: action.payload };
    case "SET_DARK_MODE":
      return { ...state, darkMode: action.payload };
    case "SET_SIDEBAR_COLLAPSED":
      return { ...state, sidebarCollapsed: action.payload };
    case "SET_USER_PROFILE":
      return { ...state, userProfile: action.payload };
    case "SET_BASIC_INFO":
      return { ...state, basicInfo: action.payload };
    case "SET_AUTH":
      return { ...state, auth: action.payload };
    case "SHOW_TOAST":
      return { ...state, toast: { message: action.payload, visible: true } };
    case "HIDE_TOAST":
      return { ...state, toast: { message: state.toast.message, visible: false } };
    case "HYDRATE":
      return {
        ...state,
        ...action.payload,
        orders: action.payload.orders ?? state.orders,
        products: action.payload.products ?? state.products,
        feeGroups: action.payload.feeGroups ?? state.feeGroups,
        basicInfo: { ...state.basicInfo, ...(action.payload.basicInfo || {}) },
        userProfile: { ...state.userProfile, ...(action.payload.userProfile || {}) },
        auth: { ...state.auth, ...(action.payload.auth || {}) },
      };
    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  dispatch: React.Dispatch<Action>;
  showToast: (message: string) => void;
  // 云同步
  isCloudConfigured: boolean;
  syncNow: () => Promise<MergeAction>;
  uploadNow: () => Promise<void>;
  downloadNow: () => Promise<void>;
  lastSyncAt: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "huishi-workbench-data";
const LAST_SYNC_KEY = "huishi-last-sync-at";

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(
    () => localStorage.getItem(LAST_SYNC_KEY)
  );

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        dispatch({ type: "HYDRATE", payload: parsed });
      } catch {
        // ignore
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state, isHydrated]);

  // 恢复登录会话：若配置过云端且本地已有会话，则恢复登录状态
  useEffect(() => {
    if (!isHydrated) return;
    if (!getSupabaseConfig()) return;
    let cancelled = false;
    getSessionUser()
      .then((user) => {
        if (cancelled) return;
        if (user?.email) {
          dispatch({
            type: "SET_AUTH",
            payload: { isAuthenticated: true, authMethod: "email", email: user.email },
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isHydrated]);

  // 云同步自动备份：数据变化后防抖 1.5s 上传
  const syncTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!isHydrated) return;
    if (!state.cloudSync || !state.auth.isAuthenticated) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(async () => {
      try {
        const user = await getSessionUser();
        if (!user) return;
        await uploadUserData(user, buildSyncPayload(state));
        const now = new Date().toISOString();
        setLastSyncAt(now);
        localStorage.setItem(LAST_SYNC_KEY, now);
      } catch {
        // 网络/配置问题静默失败，等待下一次数据变化重试
      }
    }, 1500);
    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [state, isHydrated, state.cloudSync, state.auth.isAuthenticated]);

  const showToast = (message: string) => {
    dispatch({ type: "SHOW_TOAST", payload: message });
  };

  const markSynced = () => {
    const now = new Date().toISOString();
    setLastSyncAt(now);
    localStorage.setItem(LAST_SYNC_KEY, now);
  };

  // 首次登录同步决策：返回 upload / download / conflict / skip
  async function syncNow(): Promise<MergeAction> {
    const user = await getSessionUser();
    if (!user) return "skip";
    const cloud = await downloadUserData(user);
    const action = decideMerge(state.orders, cloud);
    if (action === "upload") {
      await uploadUserData(user, buildSyncPayload(state));
      markSynced();
    } else if (action === "download" && cloud) {
      dispatch({
        type: "HYDRATE",
        payload: {
          orders: cloud.orders as Order[],
          products: cloud.products as Product[],
          feeGroups: cloud.feeGroups as FeeGroup[],
          basicInfo: cloud.basicInfo as BasicInfo,
          userProfile: cloud.userProfile as UserProfile,
        },
      });
      markSynced();
    } else if (action === "skip") {
      await uploadUserData(user, buildSyncPayload(state));
      markSynced();
    }
    return action;
  }

  // 手动上传：本地覆盖云端
  async function uploadNow() {
    const user = await getSessionUser();
    if (!user) throw new Error("未登录");
    await uploadUserData(user, buildSyncPayload(state));
    markSynced();
  }

  // 手动下载：云端覆盖本地
  async function downloadNow() {
    const user = await getSessionUser();
    if (!user) throw new Error("未登录");
    const cloud = await downloadUserData(user);
    if (!cloud) throw new Error("云端暂无数据");
    dispatch({
      type: "HYDRATE",
      payload: {
        orders: cloud.orders as Order[],
        products: cloud.products as Product[],
        feeGroups: cloud.feeGroups as FeeGroup[],
        basicInfo: cloud.basicInfo as BasicInfo,
        userProfile: cloud.userProfile as UserProfile,
      },
    });
    markSynced();
  }

  return (
    <AppContext.Provider
      value={{
        ...state,
        dispatch,
        showToast,
        isCloudConfigured: !!getSupabaseConfig(),
        syncNow,
        uploadNow,
        downloadNow,
        lastSyncAt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
