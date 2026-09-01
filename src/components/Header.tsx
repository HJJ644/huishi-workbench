import { Moon } from "lucide-react";
import { useApp } from "../store/AppContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { darkMode, dispatch } = useApp();

  return (
    <header className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-2xl font-semibold text-text">{title}</h2>
        {subtitle && (
          <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
        )}
      </div>
      <button
        onClick={() => dispatch({ type: "SET_DARK_MODE", payload: !darkMode })}
        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
      >
        <Moon className="w-5 h-5 text-text-secondary" />
      </button>
    </header>
  );
}
