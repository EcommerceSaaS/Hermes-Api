import { Response } from "express";

export function sendOKResponse(res: Response, data: any) {
  res.status(200).send(data);
}
export function sendCreatedResponse(res: Response, data: any) {
  res.status(201).send(data);
}
export function sendBadRequestResponse(res: Response, data: any) {
  return res.status(400).send(`Bad Request ${data}`);
}
export function sendUnauthorizedResponse(res: Response) {
  res.status(401).send("Unauthorized");
}
export function sendErrorResponse(res: Response, error: Error) {
  res.status(500).send(error.message);
}
export function sendForbiddenResponse(res: Response) {
  res.status(403).send("Forbidden");
}
