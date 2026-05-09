import create from "zustand";

export const useUIStore = create((set) => ({
  loading: false,
  setLoading: (l: boolean) => set({ loading: l }),
}));
