import React from "react";

export const ThemeContext = React.createContext({ theme: "light" });

export function ThemeProvider({ children }: { children?: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
}
