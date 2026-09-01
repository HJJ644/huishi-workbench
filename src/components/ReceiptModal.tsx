import { useRef } from "react";
import { Download } from "lucide-react";
import { Modal } from "./Modal";
import { useApp } from "../store/AppContext";
import { downloadElementAsPng } from "../utils/downloadPng";
import { OrderReceipt } from "./OrderReceipt";
import type { Order } from "../types";

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { feeGroups } = useApp();

  async function handleDownload() {
    if (!receiptRef.current || !order) return;
    try {
      const safeName = (order.projectName?.trim() || order.name || "未命名").replace(
        /[\\/:*?"<>|]/g,
        "_"
      );
      const safeId = order.id.replace(/[\\/:*?"<>|]/g, "_");
      await downloadElementAsPng(receiptRef.current, `${safeName}_${safeId}.png`);
    } catch {
      alert("小票下载失败，请重试");
    }
  }

  if (!order) return null;

  return (
    <Modal open={!!order} onClose={onClose} title="小票预览" className="max-w-lg">
      <div className="space-y-4">
        <OrderReceipt ref={receiptRef} order={order} feeGroups={feeGroups} />
        <div className="flex justify-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition"
          >
            <Download className="w-4 h-4" />
            下载小票
          </button>
        </div>
      </div>
    </Modal>
  );
}
