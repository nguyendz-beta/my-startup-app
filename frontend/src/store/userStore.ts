import create from "zustand";

export const useUserStore = create((set) => ({
  user: null,
  setUser: (u: any) => set({ user: u }),
}));
