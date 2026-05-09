import api from "./axios";

export const getTasks = () => api.get("/tasks");
export const createTask = (payload: any) => api.post("/tasks", payload);
