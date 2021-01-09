import { NextFunction, Response } from "express";
import { sendForbiddenResponse } from "../http/Responses";
import { adminModel } from "../../api/admin/AdminModel";

export default async function (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  const admin = await adminModel.exists({ _id: req.user.id });
  if (!admin) return sendForbiddenResponse(res);
  next();
}
