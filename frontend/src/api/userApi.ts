import api from "./axios";

export const getProfile = () => api.get("/users/me");
export const updateProfile = (payload: any) => api.put("/users/me", payload);
