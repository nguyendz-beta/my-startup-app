import { Response } from "express";
export const success = (res: Response, data: any) => res.json({ data });
