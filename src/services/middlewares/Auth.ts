import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import {
  sendForbiddenResponse,
  sendBadRequestResponse,
} from "../http/Responses";

export default function (req: Request, res: Response, next: NextFunction) {
  const token = req.header("x-auth-token");
  if (!token) return sendForbiddenResponse(res);
  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY!!);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    sendBadRequestResponse(res, "Invalid token");
  }
}
