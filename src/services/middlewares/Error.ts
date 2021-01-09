import { NextFunction, Request, Response } from "express";
import { sendErrorResponse } from "../http/Responses";
export default function (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.log(err);
  sendErrorResponse(res, err);
}
