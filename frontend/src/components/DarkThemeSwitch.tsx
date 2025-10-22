"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export default function DarkThemeSwitch() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-center">
        <input
          type="checkbox"
          id="theme-toggle"
          className="peer sr-only"
          checked={isDark}
          onChange={() => setTheme(isDark ? "light" : "dark")}
        />
        <label
          htmlFor="theme-toggle"
          className="group relative inline-flex size-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs transition-[color,box-shadow] outline-none peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 hover:bg-accent hover:text-accent-foreground"
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          <MoonIcon
            size={16}
            className="shrink-0 scale-0 opacity-0 transition-all group-peer-checked:scale-100 group-peer-checked:opacity-100"
          />
          <SunIcon
            size={16}
            className="absolute shrink-0 scale-100 opacity-100 transition-all group-peer-checked:scale-0 group-peer-checked:opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
