import { Router, Response, Request } from "express";
import {
  sendBadRequestResponse,
  sendErrorResponse,
  sendCreatedResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import { MattersModel } from "./MatterModel";
import { pick } from "lodash";
import { productTypeModel } from "../product-type/ProductTypeModel";
const matterRouter = Router({ mergeParams: true });
matterRouter.get("/", async (req: Request, res: Response) => {
  try {
    const productTypeId = req.params.productTypeId;
    if (productTypeId) {
      const matters = await productTypeModel
        .findById({ _id: productTypeId })
        .select("matters")
        .populate({
          path: "matters",
          match: { active: true },
        });
      return sendOKResponse(res, matters);
    }
    const matters = await MattersModel.find(
      req.query.active ? { active: JSON.parse(req.query.active) } : {}
    );
    sendOKResponse(res, matters);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
matterRouter.post("/", async (req: Request, res: Response) => {
  const { nameMatter } = req.body;
  if (nameMatter) {
    try {
      let matter = new MattersModel({ name: nameMatter });
      matter = await matter.save();
      sendCreatedResponse(res, matter);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  } else return sendBadRequestResponse(res, "matter's name required");
});
matterRouter.delete("/:matterId", async (req: Request, res: Response) => {
  if (!req.params.matterId)
    return sendBadRequestResponse(res, "Not a valid matter id");
  try {
    const matter = await MattersModel.findByIdAndDelete({
      _id: req.params.matterId,
    });
    sendOKResponse(res, matter);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
matterRouter.put("/:matterId", async (req: Request, res: Response) => {
  const body = pick(req.body, ["name", "active"]);
  try {
    if (!req.params.matterId)
      return sendBadRequestResponse(res, "Not a valid matter id");
    const matter = await MattersModel.findByIdAndUpdate(
      { _id: req.params.matterId },
      body,
      {
        new: true,
      }
    );
    sendOKResponse(res, matter);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
export { matterRouter };
