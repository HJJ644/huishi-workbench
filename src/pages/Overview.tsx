import { Header } from "../components/Header";
import { SectionTag } from "../components/SectionTag";
import { useApp } from "../store/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-border flex flex-col items-center justify-center min-h-[80px]">
      <div className="text-xl font-semibold text-text">{value}</div>
      <div className="text-xs text-text-secondary mt-1">{label}</div>
    </div>
  );
}

function formatCurrency(n: number) {
  return `¥${n.toFixed(2)}`;
}

function parseOrderDate(order: { orderDate?: string; deadline?: string }) {
  const raw = order.orderDate || order.deadline;
  if (!raw) return null;
  const [y, m, d] = raw.split("-").map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, d || 1);
}

function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="7" r="3.5" fill="#f2b3c6" />
      <circle cx="17.5" cy="12" r="3.5" fill="#f2c9a6" />
      <circle cx="12" cy="17" r="3.5" fill="#f2b3c6" />
      <circle cx="6.5" cy="12" r="3.5" fill="#f2c9a6" />
      <circle cx="12" cy="12" r="2.8" fill="#fff1c1" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 2l2.9 6.5h7.1l-5.5 4.8 2.1 6.7L12 15.5l-6.6 4.5 2.1-6.7L2 8.5h7.1z"
        fill="#f4d06f"
      />
    </svg>
  );
}

export function Overview() {
  const { orders } = useApp();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let pendingCount = 0;
  let totalIncome = 0;
  let totalOrders = orders.length;
  let yearlyOrders = 0;
  let yearlyIncome = 0;
  let droppedCount = 0;
  let totalFee = 0;
  let totalDiscount = 0;

  let monthOrders = 0;
  let monthIncome = 0;
  let monthDiscount = 0;
  let monthFee = 0;
  let monthDropped = 0;

  const monthlyIncome = Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1}月`,
    income: 0,
  }));

  orders.forEach((order) => {
    const amount = order.amount || 0;
    const paidAmount = order.paidAmount ?? amount;
    const feeRate = order.feeRate || 0;
    const discount =
      order.discounts?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

    totalIncome += amount;
    totalDiscount += discount;
    totalFee += (paidAmount * feeRate) / 100;

    if (order.status === "跑单" || order.status === "废稿") {
      droppedCount++;
    } else if (order.status !== "已结单") {
      pendingCount++;
    }

    const date = parseOrderDate(order);
    if (date) {
      const year = date.getFullYear();
      const month = date.getMonth();

      if (year === currentYear) {
        yearlyOrders++;
        yearlyIncome += amount;
        monthlyIncome[month].income += amount;
      }

      if (year === currentYear && month === currentMonth) {
        monthOrders++;
        monthIncome += amount;
        monthDiscount += discount;
        monthFee += (paidAmount * feeRate) / 100;
        if (order.status === "跑单" || order.status === "废稿") {
          monthDropped++;
        }
      }
    }
  });

  const monthLabel = `${currentMonth + 1}月成就`;

  return (
    <div>
      <Header title="概览" />

      <div className="flex items-center gap-3 mb-6">
        <FlowerIcon className="w-5 h-5" />
        <span className="font-cute text-lg text-text">今天你接单了吗？</span>
        <StarIcon className="w-5 h-5" />
      </div>

      <div className="space-y-5">
        <section>
          <SectionTag>数据汇总</SectionTag>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <MetricCard value={String(pendingCount)} label="待完成" />
            <MetricCard value={formatCurrency(totalIncome)} label="总收入" />
            <MetricCard value={String(totalOrders)} label="总订单数" />
            <MetricCard value={String(yearlyOrders)} label="年度订单数" />
            <MetricCard
              value={formatCurrency(yearlyIncome)}
              label="年度总收入"
            />
            <MetricCard value={String(droppedCount)} label="总跑单/废稿数" />
            <MetricCard value={formatCurrency(totalFee)} label="总手续费" />
            <MetricCard
              value={formatCurrency(totalDiscount)}
              label="总优惠金额"
            />
          </div>
        </section>

        <section>
          <SectionTag>{monthLabel}</SectionTag>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <MetricCard value={String(monthOrders)} label="月订单数" />
            <MetricCard value={formatCurrency(monthIncome)} label="月收入" />
            <MetricCard
              value={formatCurrency(monthDiscount)}
              label="月优惠金额"
            />
            <MetricCard value={formatCurrency(monthFee)} label="月手续费" />
            <MetricCard value={String(monthDropped)} label="月废稿/跑单" />
          </div>
        </section>

        <section className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold text-text mb-2">年度成就</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyIncome} margin={{ top: 8, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#a8a6a1" }}
                  interval={0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#a8a6a1" }}
                  tickFormatter={(value: number) => `¥${value}`}
                  domain={[0, "dataMax + 20"]}
                  width={44}
                />
                <Bar dataKey="income" radius={[4, 4, 0, 0]}>
                  {monthlyIncome.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.income > 0 ? "#9cb8d8" : "#e8e6e1"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-secondary">本年度总金额</span>
            <span className="text-lg font-semibold text-text">
              {formatCurrency(yearlyIncome)}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
