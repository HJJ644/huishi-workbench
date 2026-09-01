import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { useApp } from "../store/AppContext";
import { Modal } from "./Modal";
import {
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  getSessionUser,
} from "../lib/cloudSync";
import { getSupabaseConfig } from "../lib/supabase";
import type { MergeAction } from "../lib/cloudSync";

interface CloudSyncModalProps {
  open: boolean;
  onClose: () => void;
}

function isEmailValid(v: string) {
  return /^\S+@\S+\.\S+$/.test(v);
}

export function CloudSyncModal({ open, onClose }: CloudSyncModalProps) {
  const {
    cloudSync,
    auth,
    dispatch,
    showToast,
    isCloudConfigured,
    syncNow,
    uploadNow,
    downloadNow,
    lastSyncAt,
  } = useApp();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [conflict, setConflict] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setConflict(false);
    setBusy(false);
    setEmail("");
    setPassword("");
    getSessionUser()
      .then((user) => setAccountEmail(user?.email ?? null))
      .catch(() => setAccountEmail(null));
  }, [open]);

  const emailValid = isEmailValid(email);
  const signedIn = auth.isAuthenticated || !!accountEmail;
  const displayEmail = auth.email || accountEmail || "";

  async function handleAuth() {
    if (!emailValid) {
      showToast("请输入正确的邮箱地址");
      return;
    }
    if (password.length < 6) {
      showToast("密码长度至少 6 位");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        const user = await signUpWithEmail(email, password);
        if (!user) {
          showToast("注册成功，请前往邮箱完成确认后登录");
          setMode("login");
          return;
        }
        showToast("注册成功");
      } else {
        await signInWithEmail(email, password);
        showToast("登录成功");
      }
      setAccountEmail(email);
      dispatch({
        type: "SET_AUTH",
        payload: { isAuthenticated: true, authMethod: "email", email },
      });
      // 首次同步
      await runInitialSync();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setBusy(false);
    }
  }

  async function runInitialSync() {
    setBusy(true);
    try {
      const action: MergeAction = await syncNow();
      if (action === "conflict") {
        setConflict(true);
      } else if (action === "download") {
        showToast("已从云端恢复数据");
      } else if (action === "upload" || action === "skip") {
        showToast("本地数据已备份到云端");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "同步失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload() {
    setBusy(true);
    try {
      await uploadNow();
      setConflict(false);
      showToast("已备份到云端");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "备份失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true);
    try {
      await downloadNow();
      setConflict(false);
      showToast("已从云端恢复");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "恢复失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOutUser();
      dispatch({ type: "SET_AUTH", payload: { isAuthenticated: false } });
      dispatch({ type: "SET_CLOUD_SYNC", payload: false });
      setAccountEmail(null);
      setConflict(false);
      showToast("已退出登录");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "退出失败");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:border-accent transition";
  const labelClass = "block text-sm text-text-secondary font-medium mb-2";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="云同步"
      className="max-w-md"
      darkHeader
    >
      <div className="space-y-5">
        {!isCloudConfigured && !getSupabaseConfig() ? (
          <div className="text-center py-4">
            <Cloud className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary mb-4">
              尚未配置云端服务。请先在设置页填写 Supabase 项目地址与密钥，即可启用云同步。
            </p>
            <button
              onClick={() => {
                onClose();
                navigate("/settings");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition"
            >
              <Settings className="w-4 h-4" />
              前往设置
            </button>
          </div>
        ) : !signedIn ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${
                  mode === "login"
                    ? "bg-accent text-white border-accent"
                    : "bg-surface text-text-secondary border-border"
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${
                  mode === "register"
                    ? "bg-accent text-white border-accent"
                    : "bg-surface text-text-secondary border-border"
                }`}
              >
                注册账号
              </button>
            </div>
            <div>
              <label className={labelClass}>邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className={labelClass}>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="至少 6 位"
              />
            </div>
            <button
              onClick={handleAuth}
              disabled={busy}
              className="w-full py-3 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {busy ? "请稍候..." : mode === "register" ? "注册并同步" : "登录并同步"}
            </button>
            <p className="text-xs text-text-muted leading-relaxed">
              登录后数据将自动备份到云端，可在其他设备登录同一账号恢复数据。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 账号状态 */}
            <div className="flex items-center gap-3 bg-bg rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text truncate">
                  {displayEmail}
                </p>
                <p className="text-xs text-text-muted">
                  {cloudSync ? "自动备份已开启" : "自动备份已关闭"}
                  {lastSyncAt && ` · 上次同步 ${new Date(lastSyncAt).toLocaleString("zh-CN")}`}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={busy}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-bg transition disabled:opacity-60"
              >
                <LogOut className="w-3.5 h-3.5" />
                登出
              </button>
            </div>

            {/* 冲突提示 */}
            {conflict && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  本地和云端都有数据，请选择以哪边为准：
                </p>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={handleUpload}
                    disabled={busy}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-sm hover:opacity-90 transition disabled:opacity-60"
                  >
                    <CloudUpload className="w-4 h-4" />
                    以本地为准
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={busy}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-accent text-accent text-sm hover:bg-accent-light transition disabled:opacity-60"
                  >
                    <CloudDownload className="w-4 h-4" />
                    以云端为准
                  </button>
                </div>
              </div>
            )}

            {/* 同步控制 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-bg rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text">自动备份</p>
                  <p className="text-xs text-text-muted">数据变化后自动上传云端</p>
                </div>
                <button
                  onClick={() =>
                    dispatch({ type: "SET_CLOUD_SYNC", payload: !cloudSync })
                  }
                  className={`w-10 h-6 rounded-full relative transition ${
                    cloudSync ? "bg-accent" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      cloudSync ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg transition disabled:opacity-60"
                >
                  <CloudUpload className="w-4 h-4" />
                  立即备份
                </button>
                <button
                  onClick={handleDownload}
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg transition disabled:opacity-60"
                >
                  <CloudDownload className="w-4 h-4" />
                  云端恢复
                </button>
              </div>
              <button
                onClick={runInitialSync}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg transition disabled:opacity-60"
              >
                <RefreshCw className="w-4 h-4" />
                重新检查同步状态
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
