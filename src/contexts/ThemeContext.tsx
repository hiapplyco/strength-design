
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with dark theme as default, then check for stored preference
  const [theme, setThemeState] = useState<Theme>("dark");

  // Check for stored theme preference on mount
  useEffect(() => {
    const getInitialTheme = (): Theme => {
      if (typeof window !== "undefined") {
        const storedTheme = localStorage.getItem("theme") as Theme | null;
        
        if (storedTheme) {
          return storedTheme;
        }
        
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      
      return "dark"; // Default to dark theme
    };

    const initialTheme = getInitialTheme();
    setThemeState(initialTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Apply theme class to document when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Remove the old theme class from both html and body
    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");
    
    // Add the new theme class to both html and body
    root.classList.add(theme);
    body.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
    
    console.log("Theme changed to:", theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
