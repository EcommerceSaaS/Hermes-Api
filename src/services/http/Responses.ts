import { Response } from "express";

export function sendOKResponse(res: Response, data: any): void {
  res.status(200).send(data);
}
export function sendCreatedResponse(res: Response, data: any): void {
  res.status(201).send(data);
}
export function sendBadRequestResponse(res: Response, data: any): void {
  res.status(400).send(`Bad Request ${data}`);
}
export function sendUnauthorizedResponse(res: Response): void {
  res.status(401).send("Unauthorized");
}
export function sendErrorResponse(res: Response, error: Error): void {
  res.status(500).send(error.message);
}
export function sendForbiddenResponse(res: Response): void {
  res.status(403).send("Forbidden");
}
