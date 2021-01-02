import { NextFunction, Request, Response } from "express";
import { sendErrorResponse } from "../http/Responses";
export default function (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(err);
  sendErrorResponse(res, err);
}
