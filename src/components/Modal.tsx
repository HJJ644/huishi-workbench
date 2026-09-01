import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  darkHeader?: boolean;
}

export function Modal({ open, onClose, title, children, footer, className, darkHeader }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative bg-surface rounded-2xl shadow-xl w-full mx-4 max-h-[90vh] flex flex-col ${className || "max-w-lg"}`}>
        <div
          className={`flex items-center justify-between p-6 border-b border-border ${
            darkHeader ? "bg-[#2c2c35] border-[#2c2c35] rounded-t-2xl" : ""
          }`}
        >
          <h3
            className={`text-lg font-semibold ${
              darkHeader ? "text-white" : "text-text"
            }`}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-md ${
              darkHeader
                ? "text-white/70 hover:bg-white/10"
                : "hover:bg-bg text-text-secondary"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
        {footer && (
          <div className="p-6 border-t border-border flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
