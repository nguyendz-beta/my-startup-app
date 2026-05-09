import bcrypt from "bcryptjs";
export const hash = (s: string) => bcrypt.hashSync(s, 10);
export const compare = (s: string, h: string) => bcrypt.compareSync(s, h);
