import { Request, Response, NextFunction } from "express";
export function validateMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  next();
}
