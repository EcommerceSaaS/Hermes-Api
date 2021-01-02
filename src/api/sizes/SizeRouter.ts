import { Request, Router, Response } from "express";
import { Size, validateSize } from "./SizeModel";
import { pick } from "lodash";
import {
  sendOKResponse,
  sendErrorResponse,
  sendBadRequestResponse,
} from "../../services/http/Responses";
import { ISize } from "./ISize";

const sizesRouter = Router();
sizesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const result = await Promise.all([
      Size.find(
        req.query.active ? { active: JSON.parse(req.query.active) } : {}
      ),
      Size.countDocuments(
        req.query.active ? { active: JSON.parse(req.query.active) } : {}
      ),
    ]);
    sendOKResponse(res, { sizes: result[0], count: result[1] });
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
sizesRouter.get("/:id", async (req: Request, res: Response) => {
  const sizeId = req.params.id;
  try {
    const size = await Size.findById({ _id: sizeId });
    if (!size) return sendBadRequestResponse(res, "Size id does not exist");
    sendOKResponse(res, size);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
sizesRouter.post("/", async (req: Request, res: Response) => {
  const reqBody = pick(req.body, ["code", "description"]) as ISize;
  const { error } = validateSize(reqBody);
  if (error) return sendBadRequestResponse(res, error.details[0].message);
  try {
    let size = new Size(reqBody);
    size = await size.save();
    sendOKResponse(res, size);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
sizesRouter.put("/:id", async (req: Request, res: Response) => {
  const sizeId = req.params.id;
  const reqBody = pick(req.body, ["code", "description", "active"]);
  try {
    const size = await Size.findByIdAndUpdate(sizeId, reqBody, {
      new: true,
    });
    if (!size) return sendBadRequestResponse(res, "Size id does not exist");
    sendOKResponse(res, size);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
sizesRouter.delete("/:id", async (req: Request, res: Response) => {
  const sizeId = req.params.id;
  try {
    const size = await Size.findByIdAndDelete(sizeId);
    if (!size) return sendBadRequestResponse(res, "Size id does not exist");
    sendOKResponse(res, size);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

export { sizesRouter };
