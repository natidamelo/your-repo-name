import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`h-8 px-2.5 rounded-lg border border-border bg-secondary hover:bg-accent text-foreground text-xs font-medium inline-flex items-center space-x-1.5 transition active:scale-95 ${className}`}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-once" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-indigo-500 animate-spin-once" />
      )}
      {showLabel && (
        <span className="capitalize text-xs">{theme === 'dark' ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
};
