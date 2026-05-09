import React from "react";

export const AuthContext = React.createContext({});

export function AuthProvider({ children }: { children?: React.ReactNode }) {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}

