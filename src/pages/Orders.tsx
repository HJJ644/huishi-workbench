import { useMemo, useState } from "react";
import { Search, Plus, Calendar } from "lucide-react";
import { Header } from "../components/Header";
import { CreateOrderModal } from "../components/CreateOrderModal";
import { OrderActionsModal } from "../components/OrderActionsModal";
import { useApp } from "../store/AppContext";
import type { Order, OrderStatus } from "../types";

const statusFilters: { label: string; value: OrderStatus | "全部" }[] = [
  { label: "全部", value: "全部" },
  { label: "待定金", value: "待定金" },
  { label: "已结单", value: "已结单" },
  { label: "跑单", value: "跑单" },
  { label: "废稿", value: "废稿" },
];

const statusStyles: Record<OrderStatus, string> = {
  询价: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  待定金: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300",
  制作中: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300",
  待确认: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300",
  已交付: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
  已结算: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300",
  已结单: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  跑单: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300",
  废稿: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
};

function formatMonthOption(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return { value: `${y}-${m}`, label: `${y}年${m}月` };
}

function getRecentMonths(count: number) {
  const now = new Date();
  const options = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(formatMonthOption(d));
  }
  return options;
}

function isSameMonth(dateStr: string, monthValue: string) {
  if (!dateStr) return false;
  return dateStr.startsWith(monthValue);
}

function isInRange(dateStr: string, start: string, end: string) {
  if (!dateStr) return false;
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

export function Orders() {
  const { orders } = useApp();
  const [filter, setFilter] = useState<OrderStatus | "全部">("全部");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  const monthOptions = useMemo(() => getRecentMonths(12), []);

  const today = new Date();
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(today.getFullYear() - 3);
  const minDateStr = threeYearsAgo.toISOString().slice(0, 10);
  const maxDateStr = today.toISOString().slice(0, 10);

  const counts = useMemo(() => {
    const map: Record<string, number> = { 全部: orders.length };
    statusFilters.slice(1).forEach((f) => {
      map[f.value] = orders.filter((o) => o.status === f.value).length;
    });
    return map;
  }, [orders]);

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === "全部" || o.status === filter;
    const matchesMonth = !monthFilter || isSameMonth(o.deadline, monthFilter);
    const matchesRange =
      (!startDate && !endDate) || isInRange(o.deadline, startDate, endDate);
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.id.toLowerCase().includes(q) ||
      (o.projectName && o.projectName.toLowerCase().includes(q)) ||
      o.name.toLowerCase().includes(q);
    return matchesFilter && matchesMonth && matchesRange && matchesQuery;
  });

  return (
    <div>
      <Header title="订单" subtitle="管理你的约稿订单" />

      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                filter === f.value
                  ? "bg-tag text-white"
                  : "bg-surface text-text-secondary border border-border hover:bg-bg"
              }`}
            >
              {f.label}
              <span className="ml-1 opacity-80">({counts[f.value]})</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tag text-white text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          新建订单
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 mb-4">
        <h2 className="text-base font-semibold text-text mb-3">历史订单</h2>
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">
                按月筛选
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <select
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg border border-border text-sm text-text focus:border-accent"
                >
                  <option value="">全部月份</option>
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">
                开始日期
              </label>
              <input
                type="date"
                min={minDateStr}
                max={maxDateStr}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setMonthFilter("");
                }}
                className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">
                结束日期
              </label>
              <input
                type="date"
                min={minDateStr}
                max={maxDateStr}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setMonthFilter("");
                }}
                className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text focus:border-accent"
              />
            </div>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="可通过订单号和企划名称搜索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-bg border border-border text-sm text-text placeholder:text-text-muted focus:border-accent"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary">
                <th className="px-5 py-3.5 font-medium">订单号</th>
                <th className="px-5 py-3.5 font-medium">企划名称</th>
                <th className="px-5 py-3.5 font-medium">阶段</th>
                <th className="px-5 py-3.5 font-medium">截止时间</th>
                <th className="px-5 py-3.5 font-medium">金额</th>
                <th className="px-5 py-3.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 text-text-secondary">{order.id}</td>
                  <td className="px-5 py-4 text-text font-medium">
                    {order.projectName?.trim() || order.name}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${
                        statusStyles[order.status]
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {order.deadline}
                  </td>
                  <td className="px-5 py-4 text-text font-medium">
                    ¥{order.amount.toFixed(2)}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setActiveOrder(order)}
                      className="text-sm text-accent hover:text-accent/80 transition font-medium"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-text-secondary"
                  >
                    未找到匹配的订单
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderActionsModal
        order={activeOrder}
        onClose={() => setActiveOrder(null)}
        onEdit={(order) => {
          setActiveOrder(null);
          setEditOrder(order);
        }}
      />

      <CreateOrderModal
        open={createOpen || editOrder !== null}
        order={editOrder ?? undefined}
        onClose={() => {
          setCreateOpen(false);
          setEditOrder(null);
        }}
      />
    </div>
  );
}
