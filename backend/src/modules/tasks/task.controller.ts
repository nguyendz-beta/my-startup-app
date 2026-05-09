import { Request, Response } from "express";

export const list = (_req: Request, res: Response) => {
  res.json([]);
};
