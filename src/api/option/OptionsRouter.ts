import { Router, Request, Response } from "express";
import {
  sendBadRequestResponse,
  sendCreatedResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import { pick } from "lodash";
import { OptionsModel, validateOption } from "./OptionsModel";
import { IOption } from "./IOption";
import { routesFactory } from "../../utils/utils";
const optionsRouter = Router();
optionsRouter.post("/", async (req: Request, res: Response) => {
  routesFactory(res, async () => {
    const body: IOption = pick(req.body, [
      "name",
      "singleChoice",
      "values",
    ]) as IOption;
    const { error } = validateOption(body);
    if (error) sendBadRequestResponse(res, error.details[0].message);
    let option = new OptionsModel(body);
    option = await option.save();
    sendCreatedResponse(res, option);
  });
});
optionsRouter.get("/", (req: Request, res: Response) => {
  routesFactory(res, async () => {
    const options = await OptionsModel.find({ active: true });
    sendOKResponse(res, options);
  });
});

optionsRouter.put("/:id", (req: Request, res: Response) => {
  routesFactory(res, async () => {
    const body = req.body;
    const { id: optionId } = req.params;
    const option = await OptionsModel.findByIdAndUpdate(
      { _id: optionId },
      body,
      { new: true }
    );
    sendOKResponse(res, option);
  });
});
optionsRouter.delete("/:id", (req: Request, res: Response) => {
  routesFactory(res, async () => {
    const { id: optionId } = req.params;
    const option = await OptionsModel.findByIdAndDelete({ _id: optionId });
    sendOKResponse(res, option);
  });
});
export { optionsRouter };
