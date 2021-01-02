import { Request, Response, Router } from "express";
import {
  sendBadRequestResponse,
  sendErrorResponse,
  sendCreatedResponse,
  sendOKResponse,
} from "../../../services/http/Responses";
import { validator } from "../../../utils/utils";
import {
  creatCode,
  deleteCode,
  updateCode,
  getAllCodes,
} from "../CodeController";
import Joi from "@hapi/joi";
const reductionRouter = Router();
reductionRouter.post("/", async (req: Request, res: Response) => {
  try {
    const reduction = await creatCode(req, false);
    sendCreatedResponse(res, reduction);
  } catch (error) {
    if (typeof error == JSON.stringify(Joi.ValidationError))
      return sendBadRequestResponse(res, error.details[0].message);
    sendErrorResponse(res, error);
  }
});
reductionRouter.get("/", async (req: Request, res: Response) => {
  try {
    const results = await getAllCodes(req, false);
    sendOKResponse(res, { codes: results[0], count: results[1] });
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

reductionRouter.delete("/:reductionId", async (req: Request, res: Response) => {
  if (!validator(req.params.reductionId))
    return sendBadRequestResponse(res, "Not a valid reductionId");
  try {
    const redcution = await deleteCode(req.params.reductionId);
    sendOKResponse(res, redcution);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
reductionRouter.put("/:codeId", async (req: Request, res: Response) => {
  if (!validator(req.params.reductionId))
    return sendBadRequestResponse(res, "Not a valid reductionId");
  try {
    const reduction = await updateCode(req);
    sendOKResponse(res, reduction);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
export { reductionRouter };
