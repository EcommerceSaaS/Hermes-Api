import { Request, Response, Router } from "express";
import { validateOrder, OrdersModel, ordersStates } from "./OrdersModel";
import {
  sendBadRequestResponse,
  sendCreatedResponse,
  sendErrorResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import { pick, values } from "lodash";
import { ProductModel } from "../product/ProductsModel";
import { CodeModel } from "../promo-code/CodeModel";
import { IProduct } from "../product/IProduct";
import { User } from "../users/UserModel";
import Auth from "../../services/middlewares/Auth";
import {
  getTotalPriceWithDiscount,
  getShippingPriceByWilaya,
  normalizeOptionsAndValues,
} from "./OrdersController";
import { IOrder, IOrderRequest } from "./IOrder";
import { IOption } from "../option/IOption";
import mongoose from "mongoose";
interface IValue {
  name: string;
  price: number;
  _id: string;
}
const ordersRouter = Router();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
ordersRouter.post("/", [Auth], async (req: any, res: Response) => {
  const body: IOrder = pick(req.body, [
    "products",
    "subTotalPrice",
    "totalPrice",
    "state",
    "promoCode",
  ]) as IOrder;
  const { error } = validateOrder(body);
  if (error) return sendBadRequestResponse(res, error.details[0].message);
  const session = mongoose.startSession();
  try {
    const productsIds = body.products.map(
      (item: IOrderRequest) => item.productRef
    );
    // for avoiding unnecessary loops
    const productsBeforeValues: {
      [productRef: string]: {
        [optionRef: string]: string[];
      };
    } = normalizeOptionsAndValues(body.products);
    const quatities = body.products.map((item: IOrderRequest) => item.quantity);
    const [codes, products] = await Promise.all([
      CodeModel.find({
        $or: [{ code: body.promoCode }, { kind: "REDUCTION" }],
        active: true,
        expirationDate: {
          $gte: new Date(),
        },
      }),
      ProductModel.find({ _id: { $in: [...productsIds] } })
        .populate("options")
        .select("basePrice categories options"),
    ]);
    products.forEach((product) => {
      let price = product.basePrice;
      product.options.forEach((option: any) => {
        if (option.singleChoice) {
          // we'll accumulate the price since it's only one value
          if (productsBeforeValues[product._id][option._id]) {
            price += option.values.find(
              (value: IValue) =>
                value._id.toString() ===
                productsBeforeValues[product._id][option._id][0]
            ).price;
          }
        } else {
          //otherwise we loop over the values and add their prices
          option.values.forEach((value: IValue) => {
            if (
              productsBeforeValues[product._id][option._id].includes(
                value._id.toString()
              )
            ) {
              price += value.price;
            }
          });
        }
      });
      product.price = price;
      //check if promoCode applies here and apply it before multiplying by the quantity
    });

    let totalPrice = 0;
    //re-check this and try to minize this code
    if (!codes.length) {
      products.forEach((product, index) => {
        totalPrice += product.price * quatities[index];
      });
    } else {
      (await getTotalPriceWithDiscount(products, codes)).forEach(
        (item, index) => {
          totalPrice += item.priceAfterReduction
            ? item.priceAfterReduction * quatities[index]
            : item.price * quatities[index];
        }
      );
    }
    const user = await User.findById({ _id: req.user.id });
    body.subTotalPrice = totalPrice;
    //here we have all the necessary info
    //TODO body.totalPrice = totalPrice + getShippingPriceByWilaya(user.address.state);
    body.totalPrice = totalPrice;
    body.userId = req.user.id;
    const order = new OrdersModel(body);
    (await session).withTransaction(async () => {
      const [, newOrder] = await Promise.all([
        user.update({ $push: { orders: order._id } }).exec(),
        order.save(),
      ]);
      sendCreatedResponse(res, newOrder);
    });
  } catch (error) {
    sendErrorResponse(res, error);
  } finally {
    (await session).endSession();
  }
});

ordersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const filteringObject = req.query.active
      ? { active: JSON.parse(req.query.active) }
      : {};
    const orders = await OrdersModel.find(filteringObject).populate(
      "userId",
      "_id name address"
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
  const { orderId } = req.params;
  try {
    const order = await OrdersModel.findById(orderId);
    sendOKResponse(res, order);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
ordersRouter.put("/:orderId", async (req: Request, res: Response) => {
  const { state } = req.body;
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
