
"use client";

import React, { useState, createContext, useContext } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useDashboardTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useDashboardTheme must be used within a DashboardLayout");
  return context;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={isDark ? 'dark' : ''}>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
