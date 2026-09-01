import { useState } from "react";
import { Pencil, CheckCircle, Receipt, Trash2, FileX, UserX, Banknote } from "lucide-react";
import { Modal } from "./Modal";
import { useApp } from "../store/AppContext";
import { ReceiptModal } from "./ReceiptModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { CancellationModal } from "./CancellationModal";
import { RunnerModal } from "./RunnerModal";
import { DepositTicketModal } from "./DepositTicketModal";
import type { Order } from "../types";

interface OrderActionsModalProps {
  order: Order | null;
  onClose: () => void;
  onEdit: (order: Order) => void;
}

export function OrderActionsModal({ order, onClose, onEdit }: OrderActionsModalProps) {
  const { dispatch } = useApp();
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [showRunner, setShowRunner] = useState(false);

  if (!order) return null;
  const currentOrder: Order = order;

  function handleComplete() {
    const updated: Order = {
      ...currentOrder,
      status: "已结单",
      completedAt: new Date().toISOString().split("T")[0],
    };
    dispatch({ type: "UPDATE_ORDER", payload: updated });
    onClose();
  }

  function handleEdit() {
    onEdit(currentOrder);
  }

  function handleDeleteConfirm() {
    dispatch({ type: "DELETE_ORDER", payload: currentOrder.id });
    setShowDelete(false);
    onClose();
  }

  function handleCancellationConfirm(info: {
    rate: number;
    fixed: number | null;
    other: number;
    total: number;
  }) {
    const updated: Order = { ...currentOrder, status: "废稿", cancellationInfo: info };
    dispatch({ type: "UPDATE_ORDER", payload: updated });
    setShowCancellation(false);
    onClose();
  }

  function handleRunnerConfirm(info: {
    refund: number;
    fixed: number | null;
    fee: number;
  }) {
    const updated: Order = { ...currentOrder, status: "跑单", runnerInfo: info };
    dispatch({ type: "UPDATE_ORDER", payload: updated });
    setShowRunner(false);
    onClose();
  }

  const actions = [
    { label: "编辑", icon: Pencil, color: "text-blue-600", onClick: handleEdit },
    { label: "结单", icon: CheckCircle, color: "text-emerald-600", onClick: handleComplete },
    { label: "已付定金", icon: Banknote, color: "text-rose-600", onClick: () => setShowDeposit(true) },
    { label: "小票", icon: Receipt, color: "text-sky-600", onClick: () => setShowReceipt(true) },
    { label: "删除", icon: Trash2, color: "text-red-600", onClick: () => setShowDelete(true) },
    { label: "废稿", icon: FileX, color: "text-amber-600", onClick: () => setShowCancellation(true) },
    { label: "跑单", icon: UserX, color: "text-purple-600", onClick: () => setShowRunner(true) },
  ];

  return (
    <>
      <Modal open={!!order} onClose={onClose} title="订单操作" className="max-w-sm">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-text-secondary">{currentOrder.id}</p>
            <p className="text-base font-semibold text-text mt-1">
              {currentOrder.projectName?.trim() || currentOrder.name}
            </p>
            <p className="text-lg font-bold text-accent mt-1">¥{currentOrder.amount.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface hover:bg-bg p-3 transition"
              >
                <action.icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-sm text-text font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <ReceiptModal
        order={showReceipt ? currentOrder : null}
        onClose={() => setShowReceipt(false)}
      />

      <DepositTicketModal
        order={showDeposit ? currentOrder : null}
        onClose={() => setShowDeposit(false)}
      />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="删除订单"
        message="是否确定删除该条记录，删除后无法恢复，请慎重。"
        confirmText="确定删除"
        cancelText="取消删除"
      />

      <CancellationModal
        order={showCancellation ? currentOrder : null}
        onClose={() => setShowCancellation(false)}
        onConfirm={handleCancellationConfirm}
      />

      <RunnerModal
        order={showRunner ? currentOrder : null}
        onClose={() => setShowRunner(false)}
        onConfirm={handleRunnerConfirm}
      />
    </>
  );
}
