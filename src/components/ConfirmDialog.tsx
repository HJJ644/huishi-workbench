import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "确定",
  confirmColor = "bg-danger",
  cancelText = "取消",
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      className="max-w-sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl ${confirmColor} text-white text-sm font-medium hover:opacity-90 transition`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-sm text-text leading-relaxed">{message}</p>
    </Modal>
  );
}
