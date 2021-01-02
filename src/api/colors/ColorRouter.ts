import { Router, Request, Response } from "express";
import { Color, validateColor } from "./ColorModel";
import {
  sendOKResponse,
  sendErrorResponse,
  sendBadRequestResponse,
} from "../../services/http/Responses";
import { pick } from "lodash";
import { IColor } from "./IColor";

const colorsRouter = Router();
colorsRouter.get("/", async (req: Request, res: Response) => {
  const result = await Promise.all([
    Color.find(
      req.query.active ? { active: JSON.parse(req.query.active) } : {}
    ),
    Color.countDocuments(
      req.query.active ? { active: JSON.parse(req.query.active) } : {}
    ),
  ]);
  sendOKResponse(res, { colors: result[0], count: result[1] });
});
colorsRouter.post("/", async (req: Request, res: Response) => {
  const reqBody: IColor = pick(req.body, ["name", "value"]) as IColor;
  const { error } = validateColor(reqBody);
  if (error) return sendBadRequestResponse(res, error.details[0].message);
  try {
    let color = new Color(reqBody);
    color = await color.save();
    sendOKResponse(res, color);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

colorsRouter.get("/:id", async (req: Request, res: Response) => {
  const colorId = req.params.id;
  try {
    const color = await Color.find({ _id: colorId });
    if (!color) return sendBadRequestResponse(res, "Color id does not exist");
    sendOKResponse(res, color);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
colorsRouter.delete("/:id", async (req: Request, res: Response) => {
  const { id: colorId } = req.params;
  try {
    const color = await Color.findByIdAndDelete(colorId);
    if (!color) return sendBadRequestResponse(res, "Color id does not exist");
    sendOKResponse(res, color);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
colorsRouter.put("/:id", async (req: Request, res: Response) => {
  const { id: colorId } = req.params;
  const reqBody = pick(req.body, ["name", "value", "active"]);
  try {
    const newColor = await Color.findByIdAndUpdate(colorId, reqBody, {
      new: true,
    });
    if (!newColor)
      return sendBadRequestResponse(res, "Color id does not exist");
    sendOKResponse(res, newColor);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
export { colorsRouter };
