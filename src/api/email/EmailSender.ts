import { Router, Request, Response } from "express";
import { pick } from "lodash";
import MailGun from "mailgun-js";
import {
  sendBadRequestResponse,
  sendOKResponse,
  sendErrorResponse,
} from "../../services/http/Responses";
import Joi from "@hapi/joi";
export const emailRouter = Router();

emailRouter.post("/", async (req: Request, res: Response) => {
  const body = pick(req.body, ["fullName", "email", "subject", "message"]);
  const { error } = validateEmailObject(body);
  if (error) return sendBadRequestResponse(res, error.details[0].message);
  const mailOptions = {
    to: process.env.EMAIL,
    from: `${body.fullName} <${body.email}>`,
    subject: body.subject,
    text: body.message,
  };
  try {
    const mailgun = MailGun({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: "sandbox56db612e6a7b4392b4ab6de6341c6603.mailgun.org",
    });
    const result = await mailgun.messages().send(mailOptions);
    sendOKResponse(res, result);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
function validateEmailObject(email: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}) {
  const schema = Joi.object({
    fullName: Joi.string().trim().min(3).max(30).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().trim().min(1).max(50).required(),
    message: Joi.string().trim().min(1).max(50).required(),
  }).unknown();
  return schema.validate(email);
}
