import { Router, Request, Response } from "express";
import {
  sendBadRequestResponse,
  sendErrorResponse,
  sendOKResponse,
} from "../../../services/http/Responses";
import { pick } from "lodash";
import { ValuesModel, validateValue } from "./ValuesModel";
import { IValue } from "./IValue";
import { MulterError } from "multer";
import { getMulterSingle } from "../../../config/multerConfig";

const multer = getMulterSingle();
const valuesRouter = Router();
valuesRouter.post("/", async (req: Request, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) {
      return sendErrorResponse(res, err);
    }
    const file = req.file;
    if (!file) {
      return sendBadRequestResponse(res, "At least one image is required");
    }
    const body: IValue = pick(req.body, ["name", "price"]) as IValue;
    const { error } = validateValue(body);
    if (error) sendBadRequestResponse(res, error.details[0].message);
    body.image = file.filename;
    const value = new ValuesModel(body);
    await value.save();
    sendOKResponse(res, value);
  });
});
valuesRouter.get("/", (req: Request, res: Response) => {
  // const body=
  sendOKResponse(res, {});
});

valuesRouter.put("/:id", (req: Request, res: Response) => {
  // const body=
  sendOKResponse(res, {});
});
valuesRouter.delete("/:id", (req: Request, res: Response) => {
  // const body=
  sendOKResponse(res, {});
});
export { valuesRouter };
