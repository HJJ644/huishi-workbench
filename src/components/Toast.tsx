import { CheckCircle, X } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface text-text shadow-lg border border-border animate-in fade-in slide-in-from-top-2">
      <CheckCircle className="w-4 h-4 text-emerald-500" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-1 p-0.5 text-text-muted hover:text-text rounded-full"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
