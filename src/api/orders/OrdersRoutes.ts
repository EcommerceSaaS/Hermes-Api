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
ordersRouter.post("/", [], async (req: any, res: Response) => {
  const body: IOrder = pick(req.body, [
    "address",
    "products",
    "subTotalPrice",
    "totalPrice",
    "state",
    "promoCode",
  ]) as IOrder;
  const { error } = validateOrder(body);
  if (error) return sendBadRequestResponse(res, error.details[0].message);
  try {
    const productsIds = body.products.map(
      (item: IOrderRequest) => item.productRef
    );
    // for avoiding unnecessary loops
    const productsBeforeValues: {
      [productRef: string]: {
        [optionRef: string]: string[];
      };
    } = {};
    body.products.forEach((product: IOrderRequest) => {
      productsBeforeValues[product.productRef] = {};
      product.options.forEach(
        (option: { optionId: string; values: string[] }) => {
          productsBeforeValues[product.productRef][option.optionId] =
            option.values;
        }
      );
    });
    const quatities = body.products.map((item: IOrderRequest) => item.quantity);
    const [codes, products] = await Promise.all([
      CodeModel.find({
        //TODO take code expiration date into ocnsideration when filtering codes
        $or: [{ code: body.promoCode }, { kind: "REDUCTION" }],
        active: true,
      }).select("type amount artist category design kind"),
      ProductModel.find({ _id: { $in: [...productsIds] } })
        .populate("options")
        .select("basePrice categories options"),
    ]);
    let finalPrice = 0;
    products.forEach((product, index) => {
      let price = product.basePrice;
      product.options.forEach((option: any) => {
        if (option.singleChoice) {
          // we'll the price since it's only one value
          if (productsBeforeValues[product._id][option._id]) {
            price += option.values.find(
              (value: IValue) =>
                value._id.toString() ===
                productsBeforeValues[product._id][option._id][0]
            ).price;
          }
        } else {
          //otherwise we loop over the values and add the prices
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
      product.basePrice = price;
      //check if promoCode applies here and apply it before multiplying by the quantity
      finalPrice += price * quatities[index];
      console.log(product.basePrice);
    });
    sendOKResponse(res, { finalPrice });
    // let designs: IProduct[] = null;
    // let totalPrice = 0;
    // //re-check this and try to minize this code
    // if (!codes.length) {
    //   designs = products;
    //   designs.forEach((item, index) => {
    //     totalPrice += item.basePrice * quatities[index];
    //   });
    // } else {
    //   designs = await getTotalPriceWithDiscount(products, codes);
    //   designs.forEach((item, index) => {
    //     totalPrice += item.priceAfterReduction * quatities[index];
    //   });
    // }
    // const user = await User.findById({ _id: req.user.id });
    // body.subTotalPrice = totalPrice;
    // //here we have all the necessary info
    // // body.totalPrice = totalPrice + getShippingPr iceByWilaya(user.address.state);
    // body.userId = req.user.id;

    // const order = new OrdersModel(body);
    // const result = await Promise.all([
    //   user.update({ $push: { orders: order._id } }).exec(),
    //   order.save(),
    // ]);

    // sendCreatedResponse(res, result[1]);
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
