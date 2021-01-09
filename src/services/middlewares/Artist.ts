import { NextFunction, Response } from "express";
import { sendForbiddenResponse } from "../http/Responses";

export default function (req: any, res: Response, next: NextFunction): void {
  if (!req.user.isArtist) return sendForbiddenResponse(res);
  next();
}
