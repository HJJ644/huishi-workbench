import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarDays,
  Package,
  Settings,
  Info,
  LogIn,
  Cloud,
  Palette,
  PanelLeftClose,
  PanelLeft,
  Pencil,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { Modal } from "./Modal";
import { AuthModal } from "./AuthModal";
import { CloudSyncModal } from "./CloudSyncModal";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "概览" },
  { to: "/orders", icon: ShoppingBag, label: "订单" },
  { to: "/schedule", icon: CalendarDays, label: "排期" },
  { to: "/warehouse", icon: Package, label: "仓库" },
  { to: "/settings", icon: Settings, label: "设置" },
  { to: "/about", icon: Info, label: "关于" },
];

function EditProfileModal() {
  const { userProfile, dispatch, showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(userProfile.nickname);
  const [bio, setBio] = useState(userProfile.bio);

  const handleSave = () => {
    dispatch({
      type: "SET_USER_PROFILE",
      payload: { nickname: nickname.trim() || "小绘", bio: bio.trim() },
    });
    showToast("保存成功");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => {
          setNickname(userProfile.nickname);
          setBio(userProfile.bio);
          setOpen(true);
        }}
        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition"
      >
        <Pencil className="w-3 h-3" />
        <span>编辑用户资料</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="编辑用户资料"
        footer={
          <>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg transition"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm bg-accent text-white hover:opacity-90 transition"
            >
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              昵称
            </label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text focus:border-accent transition"
              placeholder="请输入昵称"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              个人简介
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text resize-none focus:border-accent transition"
              placeholder="介绍一下自己吧"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { cloudSync, sidebarCollapsed, dispatch, auth } = useApp();
  const [authOpen, setAuthOpen] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const signedIn = auth.isAuthenticated;

  const toggleSidebar = () => {
    dispatch({ type: "SET_SIDEBAR_COLLAPSED", payload: !sidebarCollapsed });
  };

  return (
    <>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
      <CloudSyncModal open={cloudOpen} onClose={() => setCloudOpen(false)} />
      <aside
      className={`fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto bg-surface border-r border-border flex flex-col h-full shrink-0 transition-all duration-300 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } w-56 ${sidebarCollapsed ? "lg:w-16" : "lg:w-56"}`}
    >
      <div
        className={`flex items-center ${
          sidebarCollapsed ? "justify-center px-2 py-5" : "justify-between px-5 py-5"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center shadow-sm shrink-0">
            <Palette className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && <ProfileHeader />}
        </div>
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:inline-flex p-1.5 rounded-lg text-text-secondary hover:bg-bg transition"
            title="收起侧边栏"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {sidebarCollapsed && (
        <div className="px-2 pb-2 hidden lg:flex justify-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-text-secondary hover:bg-bg transition"
            title="展开侧边栏"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className={`px-3 pb-2 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
        <button
          onClick={() => {
            setAuthOpen(true);
            onMobileClose();
          }}
          className={`flex items-center rounded-lg text-sm transition ${
            sidebarCollapsed ? "justify-center w-10 h-10 px-0" : "gap-2 px-4 py-2.5 w-full"
          } ${
            signedIn
              ? "text-accent"
              : "text-text-secondary hover:bg-bg"
          }`}
          title={signedIn ? (auth.email ?? "已登录") : "登录 / 注册"}
        >
          {signedIn ? (
            <LogOut className="w-4 h-4" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {!sidebarCollapsed && (
            <span className="truncate">
              {signedIn ? (auth.email ?? "已登录") : "登录 / 注册"}
            </span>
          )}
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center rounded-lg text-sm transition ${
                sidebarCollapsed
                  ? "justify-center w-10 h-10 mx-auto px-0"
                  : "gap-3 px-4 py-2.5"
              } ${
                isActive
                  ? "bg-bg text-text font-medium"
                  : "text-text-secondary hover:bg-bg"
              }`
            }
            title={item.label}
          >
            <item.icon className="w-4.5 h-4.5" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => {
            setCloudOpen(true);
            onMobileClose();
          }}
          className={`flex items-center rounded-lg text-sm text-text-secondary hover:bg-bg transition ${
            sidebarCollapsed
              ? "justify-center w-10 h-10 mx-auto px-0"
              : "justify-between px-3 py-2 w-full"
          }`}
          title="云同步"
        >
          {sidebarCollapsed ? (
            <Cloud className="w-4 h-4" />
          ) : (
            <>
              <span className="flex items-center gap-2">
                <Cloud
                  className={`w-4 h-4 ${cloudSync ? "text-accent" : ""}`}
                />
                云同步
                {signedIn && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      cloudSync
                        ? "bg-accent/10 text-accent"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {cloudSync ? "已开启" : "已登录"}
                  </span>
                )}
              </span>
              <div
                className={`w-9 h-5 rounded-full relative transition ${
                  cloudSync ? "bg-accent" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    cloudSync ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </>
          )}
        </button>
      </div>
    </aside>
  </>
  );
}

function ProfileHeader() {
  const { userProfile } = useApp();
  return (
    <div className="min-w-0">
      <h1 className="font-semibold text-text text-base leading-tight truncate">
        {userProfile.nickname}
      </h1>
      <EditProfileModal />
    </div>
  );
}
