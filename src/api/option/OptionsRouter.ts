import { Router, Request, Response } from "express";
import {
  sendBadRequestResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import { pick } from "lodash";
import { OptionsModel, validateOption } from "./OptionsModel";
import { IOption } from "./IOption";
import { ValuesModel } from "./values/ValuesModel";

const optionsRouter = Router();
optionsRouter.post("/", async (req: Request, res: Response) => {
  const body: IOption = pick(req.body, ["name", "values"]) as IOption;
  const { error } = validateOption(body);
  if (error) sendBadRequestResponse(res, error.details[0].message);
  let option = new OptionsModel(body);
  const valueRes = await ValuesModel.updateMany(
    { _id: { $in: [...option.values] } },
    { optionId: option._id }
  );
  console.log({ valueRes });
  option = await option.save();
  sendOKResponse(res, option);
});
optionsRouter.get("/", (req: Request, res: Response) => {
  // const body=
  sendOKResponse(res, {});
});

optionsRouter.put("/:id", (req: Request, res: Response) => {
  // const body=
  sendOKResponse(res, {});
});
optionsRouter.delete("/:id", (req: Request, res: Response) => {
  // const body=
  sendOKResponse(res, {});
});
export { optionsRouter };
