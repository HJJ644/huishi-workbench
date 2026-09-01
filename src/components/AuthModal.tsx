import { useEffect, useState } from "react";
import { useApp } from "../store/AppContext";
import { Modal } from "./Modal";
import { signInWithEmail, signUpWithEmail } from "../lib/cloudSync";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
}

type AuthMode = "register" | "login";

function isEmailValid(v: string) {
  return /^\S+@\S+\.\S+$/.test(v);
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const { dispatch, showToast, syncNow, isCloudConfigured } = useApp();

  const [mode, setMode] = useState<AuthMode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("register");
    setEmail("");
    setPassword("");
    setLoading(false);
  }, [open]);

  const emailValid = isEmailValid(email);

  async function handleSubmit() {
    if (!emailValid) {
      showToast("请输入正确的邮箱地址");
      return;
    }
    if (password.length < 6) {
      showToast("密码长度至少 6 位");
      return;
    }
    setLoading(true);
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
      dispatch({
        type: "SET_AUTH",
        payload: { isAuthenticated: true, authMethod: "email", email },
      });
      // 登录成功后立即尝试首次同步（合并决策）
      if (isCloudConfigured) {
        try {
          await syncNow();
        } catch {
          // 同步失败不阻塞登录
        }
      }
      onAuthenticated?.();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:border-accent transition";
  const labelClass = "block text-sm text-text-secondary font-medium mb-2";

  const tabBase =
    "flex-1 py-2.5 rounded-xl text-sm font-medium transition border";
  const tabActive = "bg-accent text-white border-accent";
  const tabInactive =
    "bg-surface text-text-secondary border-border hover:border-accent/50";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="账号登录 / 注册"
      className="max-w-md"
      darkHeader
      footer={
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? "请稍候..." : mode === "register" ? "注册并登录" : "登录"}
        </button>
      }
    >
      <div className="space-y-5">
        {/* 注册 / 登录 切换 */}
        <div className="flex gap-3">
          <button
            onClick={() => setMode("register")}
            className={`${tabBase} ${mode === "register" ? tabActive : tabInactive}`}
          >
            注册账号
          </button>
          <button
            onClick={() => setMode("login")}
            className={`${tabBase} ${mode === "login" ? tabActive : tabInactive}`}
          >
            登录
          </button>
        </div>

        {/* 邮箱 */}
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

        {/* 密码 */}
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

        <p className="text-xs text-text-muted leading-relaxed">
          {isCloudConfigured
            ? "登录后数据将自动备份到云端，可在其他设备登录同一账号恢复数据。"
            : "登录后可启用云同步。若尚未配置云端服务，请先前往「设置 - 云同步」填写 Supabase 项目信息。"}
        </p>
      </div>
    </Modal>
  );
}
