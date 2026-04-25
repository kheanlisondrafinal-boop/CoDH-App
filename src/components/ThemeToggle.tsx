import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent dark:border-slate-700 shadow-sm"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon size={20} strokeWidth={2.5} />
      ) : (
        <Sun size={20} strokeWidth={2.5} />
      )}
    </button>
  );
};

export default ThemeToggle;
