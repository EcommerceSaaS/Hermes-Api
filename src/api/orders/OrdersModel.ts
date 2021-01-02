/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { IOrder, IOrderRequest } from "./IOrder";
import { validator } from "../../utils/utils";
import Joi from "@hapi/joi";
import { ProductModel } from "../product/ProductsModel";
const ordersStates = ["onhold", "ready", "delivered"];
const necklineTypes = [
  "Unisexe Regular",
  "Unisexe Premium",
  "Unisexe Slim Fit",
  "Unisexe Manches Longues",
  "Women Regular",
  "Women Premium",
  "Women Long Sleeve",
  "Kids",
  "Sweat-Shirt",
  "Pull",
  "Sweat-shirt Enfant",
];
export const ORDERS_SCHEMA = "orders";
const ordersSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    address: {
      fullAdresse: String,
      state: String,
      city: String,
      postalCode: Number,
    },
    designs: [
      new mongoose.Schema(
        {
          designRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Designs",
            validate: {
              validator,
              message: `ObjectId is Not valid`,
            },
          },
          size: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "sizes",
            validate: {
              validator,
              message: `ObjectId is Not valid`,
            },
          },
          color: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "colors",
            validate: {
              validator,
              message: `ObjectId is Not valid`,
            },
          },
          quantity: {
            type: Number,
            min: 1,
            required: true,
          },
          neckline: {
            type: String,
            enum: necklineTypes,
            required: true,
          },
        },
        { _id: false }
      ),
    ],
    //without shippping included
    subTotalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: { type: Number, required: true, min: 0 }, //with shipping included
    state: { type: String, required: true, enum: ordersStates },
  },
  { versionKey: false, timestamps: true }
);
ordersSchema.pre("save", async function (this: any, next: any) {
  try {
    const designIds: string[] = [];
    this.designs.forEach((design: IOrderRequest) => {
      designIds.push(design.designRef);
    });

    await ProductModel.update(
      { _id: { $in: designIds } },
      { $inc: { numberOfOrders: 1 } },
      { multi: true }
    );
  } catch (error) {
    console.log(error);
  }
  next();
});
ordersSchema.post("findOneAndDelete", async function (doc: any) {
  try {
    const designIds: string[] = [];
    doc.designs.forEach((design: IOrderRequest) => {
      designIds.push(design.designRef);
    });
    await ProductModel.update(
      { _id: { $in: designIds } },
      { $inc: { numberOfOrders: -1 } },
      { multi: true }
    );
  } catch (error) {
    console.log(error);
  }
});

const OrdersModel = mongoose.model<IOrder>(ORDERS_SCHEMA, ordersSchema);
function validateOrder(order: IOrder): Joi.ValidationResult {
  const schema = Joi.object({
    address: Joi.object({
      fullAdresse: Joi.string().required(),
      state: Joi.string().required(),
      city: Joi.string().required(),
      postalCode: Joi.number().required(),
    }).required(),
    designs: Joi.array().items(
      Joi.object({
        designRef: Joi.string().required(),
        size: Joi.string().required(),
        color: Joi.string().required(),
        neckline: Joi.string()
          .valid(...necklineTypes)
          .required(),
        quantity: Joi.number().min(1).required(),
      })
    ),
    subTotalPrice: Joi.number().min(0),
    totalPrice: Joi.number().min(0),
    state: Joi.string()
      .valid(...ordersStates)
      .required(),
    promoCode: Joi.string().uppercase(),
  });
  return schema.validate(order);
}
export { OrdersModel, validateOrder, ordersStates };
