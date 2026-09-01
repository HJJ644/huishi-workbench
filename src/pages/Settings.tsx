import { useState } from "react";
import { Plus, Copy, Check, Cloud, ExternalLink } from "lucide-react";
import { Header } from "../components/Header";
import { useApp } from "../store/AppContext";
import type { FeeGroup, FeeItem } from "../types";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  resetSupabaseClient,
} from "../lib/supabase";
import { SETUP_SQL } from "../lib/cloudSync";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function Settings() {
  const { feeGroups, basicInfo, dispatch, showToast } = useApp();
  const [cloudUrl, setCloudUrl] = useState(getSupabaseConfig()?.url ?? "");
  const [cloudKey, setCloudKey] = useState(getSupabaseConfig()?.anonKey ?? "");
  const [copied, setCopied] = useState(false);
  const configured = !!getSupabaseConfig();

  function updateGroup(updated: FeeGroup) {
    dispatch({
      type: "SET_FEE_GROUPS",
      payload: feeGroups.map((g) => (g.id === updated.id ? updated : g)),
    });
  }

  function updateBasicInfo(patch: Partial<typeof basicInfo>) {
    dispatch({
      type: "SET_BASIC_INFO",
      payload: { ...basicInfo, ...patch },
    });
  }

  function addItem(group: FeeGroup) {
    updateGroup({
      ...group,
      items: [...group.items, { id: generateId(), name: "", rate: 0 }],
    });
  }

  function updateItem(
    group: FeeGroup,
    itemId: string,
    field: keyof FeeItem,
    value: string | number
  ) {
    updateGroup({
      ...group,
      items: group.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    });
  }

  function removeItem(group: FeeGroup, itemId: string) {
    updateGroup({
      ...group,
      items: group.items.filter((item) => item.id !== itemId),
    });
  }

  return (
    <div>
      <Header title="设置" subtitle="费用与选项配置" />

      <div className="space-y-6">
        {/* 基本信息 */}
        <section className="bg-surface rounded-2xl border border-border p-4 sm:p-6">
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-text text-white text-sm font-medium mb-5">
            基本信息
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                美工圈名
              </label>
              <input
                type="text"
                value={basicInfo.circleName}
                onChange={(e) =>
                  updateBasicInfo({ circleName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:border-accent"
                placeholder="输入美工圈名"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                联系方式
              </label>
              <input
                type="text"
                value={basicInfo.contact}
                onChange={(e) =>
                  updateBasicInfo({ contact: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:border-accent"
                placeholder="输入联系方式"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                定金（%）
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={basicInfo.depositRate}
                onChange={(e) =>
                  updateBasicInfo({
                    depositRate: Math.min(
                      100,
                      Math.max(0, Number(e.target.value))
                    ),
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:border-accent"
                placeholder="50"
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-text-muted">
            「定金金额」= 实付×比例
          </p>

          <button
            onClick={() => {
              dispatch({ type: "SET_BASIC_INFO", payload: basicInfo });
              showToast("保存成功");
            }}
            className="mt-4 w-full py-3 rounded-xl bg-text text-white font-medium hover:opacity-90 transition"
          >
            保存基本信息
          </button>
        </section>

        {feeGroups.map((group) => (
          <section
            key={group.id}
            className="bg-surface rounded-2xl border border-border p-4 sm:p-6"
          >
            <h3 className="text-base font-semibold text-text">{group.title}</h3>
            <p className="text-sm text-text-secondary mt-1">
              {group.id === "payment" && "为不同支付方式设置手续费比例，0 代表不收取。"}
              {group.id === "usage" && "不同用途对应的折扣比例，0 为原价；如 20 表示该用途按 8 折计价。"}
              {group.id === "urgency" && "加急等级对应的额外费用比例，按制品折后小计计算。"}
              {group.id === "public" && "不公开等级对应的额外费用比例，按制品折后小计计算。"}
            </p>

            <div className="mt-5 space-y-3">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      updateItem(group, item.id, "name", e.target.value)
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:border-accent"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={item.rate}
                      onChange={(e) =>
                        updateItem(
                          group,
                          item.id,
                          "rate",
                          Number(e.target.value)
                        )
                      }
                      className="w-20 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text text-right focus:border-accent"
                    />
                    <span className="text-sm text-text-secondary w-5">%</span>
                  </div>
                  <button
                    onClick={() => removeItem(group, item.id)}
                    className="px-3 py-2 text-sm text-danger hover:bg-red-50 rounded-lg transition"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addItem(group)}
              className="mt-4 flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-text-muted text-sm text-text-secondary hover:bg-bg transition"
            >
              <Plus className="w-4 h-4" />
              {group.id === "payment" && "新增支付方式"}
              {group.id === "usage" && "添加用途"}
              {group.id === "urgency" && "添加加急"}
              {group.id === "public" && "添加公开"}
            </button>
          </section>
        ))}

        {/* 云同步 */}
        <section className="bg-surface rounded-2xl border border-border p-4 sm:p-6">
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-text text-white text-sm font-medium mb-5">
            <Cloud className="w-4 h-4 mr-1.5" />
            云同步
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-text-secondary mb-1.5">
                Supabase 项目地址（Project URL）
              </label>
              <input
                type="text"
                value={cloudUrl}
                onChange={(e) => setCloudUrl(e.target.value.trim())}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:border-accent"
                placeholder="https://xxxx.supabase.co"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-text-secondary mb-1.5">
                anon 公开密钥（anon public key）
              </label>
              <input
                type="password"
                value={cloudKey}
                onChange={(e) => setCloudKey(e.target.value.trim())}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:border-accent"
                placeholder="eyJhbGciOi..."
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (!/^https?:\/\/.+/.test(cloudUrl) || cloudKey.length < 20) {
                showToast("请填写正确的项目地址与 anon 密钥");
                return;
              }
              saveSupabaseConfig({ url: cloudUrl, anonKey: cloudKey });
              resetSupabaseClient();
              showToast("云同步配置已保存");
            }}
            className="mt-4 w-full py-3 rounded-xl bg-text text-white font-medium hover:opacity-90 transition"
          >
            {configured ? "更新云端配置" : "保存云端配置"}
          </button>

          <div className="mt-5 rounded-xl bg-bg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-text">
                初始化数据表（首次使用需执行一次）
              </h4>
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(SETUP_SQL)
                    .then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    })
                    .catch(() => showToast("复制失败，请手动复制"));
                }}
                className="inline-flex items-center gap-1 text-xs text-accent hover:opacity-80 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    复制 SQL
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-text-muted mb-3 leading-relaxed">
              1. 登录{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-accent inline-flex items-center gap-0.5"
              >
                Supabase 控制台 <ExternalLink className="w-3 h-3" />
              </a>{" "}
              创建免费项目；
              <br />
              2. 复制上方 SQL，粘贴到「SQL Editor」执行；
              <br />
              3. 回到本页填写项目地址和 anon 密钥保存即可。
            </p>
            <pre className="text-[11px] leading-relaxed text-text-secondary bg-surface border border-border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
              {SETUP_SQL}
            </pre>
          </div>
        </section>

        <button
          onClick={() => showToast("保存成功")}
          className="w-full py-3 rounded-xl bg-tag text-white font-medium hover:opacity-90 transition"
        >
          保存
        </button>
      </div>
    </div>
  );
}
