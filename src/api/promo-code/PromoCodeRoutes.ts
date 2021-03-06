import { Request, Response, Router } from "express";
import { validator } from "../../utils/utils";
import {
  sendBadRequestResponse,
  sendErrorResponse,
  sendCreatedResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import {
  creatCode,
  deleteCode,
  updateCode,
  getAllCodes,
} from "./CodeController";
import Joi from "@hapi/joi";
const promoCodeRouter = Router();
promoCodeRouter.post("/", async (req: Request, res: Response) => {
  try {
    const promoCode = await creatCode(req, true);
    sendCreatedResponse(res, promoCode);
  } catch (error) {
    if (typeof error == JSON.stringify(Joi.ValidationError))
      return sendBadRequestResponse(res, error.details[0].message);
    sendErrorResponse(res, error);
  }
});
promoCodeRouter.get("/", async (req: Request, res: Response) => {
  try {
    const [codes, count] = await getAllCodes(req, true);
    sendOKResponse(res, { data: codes, count });
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
promoCodeRouter.delete("/:codeId", async (req: Request, res: Response) => {
  if (!validator(req.params.codeId))
    return sendBadRequestResponse(res, "Not a valid codeId");
  try {
    const promoCode = await deleteCode(req.params.codeId);
    sendOKResponse(res, promoCode);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
promoCodeRouter.put("/:codeId", async (req: Request, res: Response) => {
  if (!validator(req.params.codeId))
    return sendBadRequestResponse(res, "Not a valid codeId");
  try {
    const promoCode = await updateCode(req);
    sendOKResponse(res, promoCode);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
export { promoCodeRouter };
