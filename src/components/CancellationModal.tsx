import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import type { Order } from "../types";

interface CancellationModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (info: { rate: number; fixed: number | null; other: number; total: number }) => void;
}

function formatMoney(n: number) {
  return `¥${n.toFixed(2)}`;
}

export function CancellationModal({ order, onClose, onConfirm }: CancellationModalProps) {
  const paid = order?.amount ?? 0;
  const [rate, setRate] = useState(0);
  const [fixed, setFixed] = useState<number | "">("");
  const [other, setOther] = useState(0);

  useEffect(() => {
    if (order?.cancellationInfo) {
      setRate(order.cancellationInfo.rate);
      setFixed(order.cancellationInfo.fixed ?? "");
      setOther(order.cancellationInfo.other);
    } else {
      setRate(0);
      setFixed("");
      setOther(0);
    }
  }, [order]);

  const percentageFee = useMemo(() => paid * (rate / 100), [paid, rate]);
  const finalFee = useMemo(() => {
    if (fixed !== "" && Number(fixed) > 0) return Number(fixed);
    return percentageFee;
  }, [fixed, percentageFee]);
  const total = useMemo(() => finalFee + other, [finalFee, other]);

  function handleConfirm() {
    onConfirm({ rate, fixed: fixed === "" ? null : Number(fixed), other, total });
  }

  if (!order) return null;

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text focus:border-accent transition";
  const labelClass = "block text-sm text-text-secondary mb-1.5";

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title="废稿结算"
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
            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:opacity-90 transition"
          >
            确认废稿
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
          <label className={labelClass}>废稿金额比例 (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={rate}
            onChange={(e) => setRate(Math.max(0, Math.min(100, Number(e.target.value))))}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-text-muted">
            自动计算废稿费：{formatMoney(percentageFee)}
          </p>
        </div>

        <div>
          <label className={labelClass}>手动固定废稿金额（选填）</label>
          <input
            type="number"
            min={0}
            value={fixed}
            placeholder="不填则按上方比例计算"
            onChange={(e) => setFixed(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-text-muted">填写后以此金额为准</p>
        </div>

        <div>
          <label className={labelClass}>其他费用</label>
          <input
            type="number"
            min={0}
            value={other}
            onChange={(e) => setOther(Math.max(0, Number(e.target.value)))}
            className={inputClass}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
          <span className="text-sm text-amber-800 font-medium">本次实付金额</span>
          <span className="text-xl font-bold text-amber-900">{formatMoney(total)}</span>
        </div>
      </div>
    </Modal>
  );
}
