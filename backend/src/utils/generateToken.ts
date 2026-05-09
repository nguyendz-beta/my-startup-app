import { signAccess } from "./jwt";
export const generateToken = (payload: any) => signAccess(payload);