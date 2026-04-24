import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "dark",
  setTheme: () => {},
  isDark: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("vc-theme");
    const validStored = stored === "light" || stored === "dark" ? stored : null;
    const system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const initial = validStored ?? system;
    applyTheme(initial);
    setThemeState(initial);
    setMounted(true);
  }, []);

  const applyTheme = (t) => {
    const root = document.documentElement;
    root.classList.remove("dark");
    if (t === "dark") root.classList.add("dark");
    // Also set data-theme for VC-main-ui design system
    root.setAttribute("data-theme", t);
  };

  const setTheme = (t) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem("vc-theme", t);
  };

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
};
