import { Request, Response, Router } from "express";
import { validateOrder, OrdersModel, ordersStates } from "./OrdersModel";
import {
  sendBadRequestResponse,
  sendCreatedResponse,
  sendErrorResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import { pick } from "lodash";
import { DesignModel } from "../design/DesignModel";
import { CodeModel } from "../promo-code/CodeModel";
import { IDesign } from "../design/IDesign";
import { User } from "../users/UserModel";
import Auth from "../../services/middlewares/Auth";
import {
  getTotalPriceWithDiscount,
  getShippingPriceByWilaya,
} from "./OrdersController";
import { IOrder, IOrderRequest } from "./IOrder";

const ordersRouter = Router();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
ordersRouter.post("/", [Auth], async (req: any, res: Response) => {
  const body: IOrder = pick(req.body, [
    "address",
    "designs",
    "subTotalPrice",
    "totalPrice",
    "state",
    "promoCode",
  ]) as IOrder;
  const { error } = validateOrder(body);
  if (error) return sendBadRequestResponse(res, error.details[0].message);
  try {
    const designIds = body.designs.map((item: IOrderRequest) => item.designRef);
    const quatities = body.designs.map((item: IOrderRequest) => item.quantity);
    const results = await Promise.all([
      CodeModel.find({
        $or: [{ code: body.promoCode }, { kind: "REDUCTION" }],
      }).select("type amount artist category design kind"),
      DesignModel.find({ _id: { $in: [...designIds] } }).select(
        "totalPrice categories"
      ),
    ]);
    let designs: IDesign[] = null;
    let totalPrice = 0;

    if (!results[0].length) {
      designs = results[1];
      designs.forEach((item, index) => {
        totalPrice += item.totalPrice * quatities[index];
      });
    } else {
      designs = await getTotalPriceWithDiscount(results[1], results[0]);
      designs.forEach((item, index) => {
        totalPrice += item.priceAfterReduction * quatities[index];
      });
    }
    const user = await User.findById({ _id: req.user.id });
    body.subTotalPrice = totalPrice;
    //here we have all the necessary info
    body.totalPrice = totalPrice + getShippingPriceByWilaya(user.adresse.state);
    body.ownerId = req.user.id;

    const order = new OrdersModel(body);
    const result = await Promise.all([
      user.update({ $push: { orders: order._id } }).exec(),
      order.save(),
    ]);

    sendCreatedResponse(res, result[1]);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

ordersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const filteringObject = req.query.active
      ? { active: JSON.parse(req.query.active) }
      : {};
    const orders = await OrdersModel.find(filteringObject).populate(
      "ownerId",
      "_id name"
    );
    sendOKResponse(res, orders);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
ordersRouter.delete("/:orderId", [Auth], async (req: any, res: Response) => {
  const { orderId } = req.params;
  try {
    const result = await Promise.all([
      OrdersModel.findOneAndDelete({ _id: orderId }),
      User.findByIdAndUpdate(req.user.id, {
        $pull: {
          orders: orderId,
        },
      }),
    ]);
    sendOKResponse(res, result[0]);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
ordersRouter.get("/:orderId", async (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  try {
    const order = await OrdersModel.findById(orderId);
    sendOKResponse(res, order);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
ordersRouter.put("/:orderId", async (req: Request, res: Response) => {
  const state = req.body.state;
  try {
    if (ordersStates.includes(state)) {
      const order = await OrdersModel.findByIdAndUpdate(
        req.params.orderId,
        { state: state },
        { new: true }
      );
      sendOKResponse(res, order);
    } else sendBadRequestResponse(res, "Not a valid order state");
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

export { ordersRouter };
