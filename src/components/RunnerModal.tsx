import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import type { Order } from "../types";

interface RunnerModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (info: { refund: number; fixed: number | null; fee: number }) => void;
}

function formatMoney(n: number) {
  return `¥${n.toFixed(2)}`;
}

export function RunnerModal({ order, onClose, onConfirm }: RunnerModalProps) {
  const paid = order?.amount ?? 0;
  const [refund, setRefund] = useState(0);
  const [fixed, setFixed] = useState<number | "">("");

  useEffect(() => {
    if (order?.runnerInfo) {
      setRefund(order.runnerInfo.refund);
      setFixed(order.runnerInfo.fixed ?? "");
    } else {
      // 默认已退还金额等于实付金额，跑单费为 0
      setRefund(paid);
      setFixed("");
    }
  }, [order, paid]);

  const percentageFee = useMemo(() => Math.max(0, paid - refund), [paid, refund]);
  const finalFee = useMemo(() => {
    if (fixed !== "" && Number(fixed) >= 0) return Number(fixed);
    return percentageFee;
  }, [fixed, percentageFee]);

  function handleConfirm() {
    onConfirm({ refund, fixed: fixed === "" ? null : Number(fixed), fee: finalFee });
  }

  if (!order) return null;

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text focus:border-accent transition";
  const labelClass = "block text-sm text-text-secondary mb-1.5";

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title="跑单结算"
      className="max-w-md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg transition"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:opacity-90 transition"
          >
            确认跑单
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
          <span className="text-sm text-text-secondary">订单实付金额</span>
          <span className="text-lg font-bold text-text">{formatMoney(paid)}</span>
        </div>

        <div>
          <label className={labelClass}>已退还金额</label>
          <input
            type="number"
            min={0}
            value={refund}
            onChange={(e) => setRefund(Math.max(0, Number(e.target.value)))}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-text-muted">
            自动计算跑单费：{formatMoney(percentageFee)}
          </p>
        </div>

        <div>
          <label className={labelClass}>手动固定跑单费（选填）</label>
          <input
            type="number"
            min={0}
            value={fixed}
            placeholder="不填则按上方计算"
            onChange={(e) => setFixed(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-text-muted">填写后以此金额为准</p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
          <span className="text-sm text-purple-800 font-medium">跑单费</span>
          <span className="text-xl font-bold text-purple-900">{formatMoney(finalFee)}</span>
        </div>
      </div>
    </Modal>
  );
}
