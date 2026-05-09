import { sign } from "./jwt";
export const generateToken = (payload: any) => sign(payload);
