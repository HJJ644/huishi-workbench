import { useMemo, useRef } from "react";
import { Download } from "lucide-react";
import { Modal } from "./Modal";
import { useApp } from "../store/AppContext";
import { downloadElementAsPng } from "../utils/downloadPng";
import type { Order } from "../types";

interface DepositTicketModalProps {
  order: Order | null;
  onClose: () => void;
}

const finishedStatuses = new Set(["已结单", "跑单", "废稿"]);

function formatChineseDate(dateStr: string) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${y}年${m}月${d}日`;
}

export function DepositTicketModal({ order, onClose }: DepositTicketModalProps) {
  const { orders } = useApp();
  const ticketRef = useRef<HTMLDivElement>(null);

  const ticketNo = useMemo(() => {
    if (!order) return "";
    const unfinished = orders
      .filter((o) => !finishedStatuses.has(o.status))
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
    const index = unfinished.findIndex((o) => o.id === order.id);
    const seq = index >= 0 ? index + 1 : unfinished.length + 1;
    return `A${String(seq).padStart(3, "0")}`;
  }, [orders, order]);

  async function handleDownload() {
    if (!ticketRef.current || !order) return;
    try {
      const safeName = (order.projectName?.trim() || order.name || "未命名").replace(
        /[\\/:*?"<>|]/g,
        "_"
      );
      const safeId = order.id.replace(/[\\/:*?"<>|]/g, "_");
      await downloadElementAsPng(
        ticketRef.current,
        `${safeName}_${safeId}_取号单.png`
      );
    } catch {
      alert("取号单下载失败，请重试");
    }
  }

  if (!order) return null;
  const title = order.projectName?.trim() || order.name;

  return (
    <Modal open={!!order} onClose={onClose} title="已付定金" className="max-w-sm">
      <div ref={ticketRef} className="bg-white rounded-xl p-6 text-center">
        <div className="text-base font-semibold text-text mb-1">{title}</div>
        <div className="text-xs text-text-secondary mb-4">{order.id}</div>

        <div className="border-t border-dashed border-border my-4" />

        <div className="text-sm text-text-secondary mb-2">取餐号</div>
        <div className="text-5xl font-bold text-emerald-600 tracking-wider mb-2">
          {ticketNo}
        </div>
        <div className="text-xs text-text-muted mb-4">
          请向商家出示取餐号码
        </div>

        <div className="border-t border-dashed border-border my-4" />

        <div className="text-sm text-text-secondary">
          截稿日期：{formatChineseDate(order.deadline)}
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition"
        >
          <Download className="w-4 h-4" />
          下载取号单
        </button>
      </div>
    </Modal>
  );
}
