import create from "zustand";

type State = { tasks: any[]; setTasks: (t: any[]) => void };
export const useTaskStore = create<State>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
}));
