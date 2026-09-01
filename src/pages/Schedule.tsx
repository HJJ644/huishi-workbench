import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "../components/Header";
import { useApp } from "../store/AppContext";
import { OrderActionsModal } from "../components/OrderActionsModal";
import { CreateOrderModal } from "../components/CreateOrderModal";
import type { Order, OrderStatus } from "../types";

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

export function Schedule() {
  const { orders } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 21));
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay();

  const days = useMemo(() => {
    const cells: {
      date: number;
      isCurrentMonth: boolean;
      fullDate: string;
    }[] = [];

    const prevDays = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({
        date: prevDays - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevDays - i)
          .toISOString()
          .split("T")[0],
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i).toISOString().split("T")[0],
      });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i).toISOString().split("T")[0],
      });
    }
    return cells;
  }, [year, month, startWeekday, daysInMonth]);

  const todayStr = new Date(2026, 7, 21).toISOString().split("T")[0];

  const events = useMemo(() => {
    const map: Record<
      string,
      { id: string; name: string; color: string; status: OrderStatus }[]
    > = {};
    orders.forEach((order) => {
      if (order.status === "已结单" || !order.deadline) return;
      if (!map[order.deadline]) map[order.deadline] = [];
      map[order.deadline].push({
        id: order.id,
        name: order.projectName?.trim() || order.name,
        status: order.status,
        color:
          order.status === "待确认"
            ? "bg-event-orange text-orange-800"
            : order.status === "已交付" || order.status === "已结算"
            ? "bg-green-100 text-green-800"
            : order.status === "待定金"
            ? "bg-amber-100 text-amber-800"
            : "bg-event-blue text-blue-800",
      });
    });
    return map;
  }, [orders]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToday() {
    setCurrentDate(new Date(2026, 7, 21));
  }

  function handleEventClick(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (order) setSelectedOrder(order);
  }

  function handleEdit(order: Order) {
    setSelectedOrder(null);
    setEditOrder(order);
  }

  return (
    <div>
      <Header title="排期" subtitle="deadlines一目了然" />

      <div className="bg-surface rounded-2xl border border-border p-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text">
            {year}年{month + 1}月
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-bg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg"
            >
              今
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-bg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-text-secondary py-1.5"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const isToday = day.fullDate === todayStr && day.isCurrentMonth;
            const dayEvents = events[day.fullDate] || [];
            return (
              <div
                key={idx}
                className={`min-h-[44px] sm:min-h-[72px] rounded-lg border p-1 transition ${
                  day.isCurrentMonth
                    ? "bg-surface border-border"
                    : "bg-bg border-transparent text-text-muted"
                } ${isToday ? "ring-2 ring-accent ring-offset-1" : ""}`}
              >
                <div
                  className={`text-xs font-medium mb-0.5 ${
                    isToday ? "text-accent" : ""
                  }`}
                >
                  {day.date}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => handleEventClick(ev.id)}
                      className={`w-full text-left text-[9px] px-1 py-0.5 rounded truncate ${ev.color} hover:opacity-80 transition`}
                    >
                      {ev.name.length > 5 ? ev.name.slice(0, 4) + "..." : ev.name}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-text-muted px-1">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <OrderActionsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onEdit={handleEdit}
      />

      <CreateOrderModal
        open={!!editOrder}
        onClose={() => setEditOrder(null)}
        order={editOrder ?? undefined}
      />
    </div>
  );
}
