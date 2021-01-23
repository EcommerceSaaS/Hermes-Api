/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { IOrder, IOrderRequest } from "./IOrder";
import { validator } from "../../utils/utils";
import Joi from "@hapi/joi";
import { ProductModel, PRODUCTS_SCHEMA } from "../product/ProductsModel";
import { OPTIONS_SCHEMA } from "../option/OptionsModel";
const ordersStates = ["onhold", "ready", "delivered"];
export const ORDERS_SCHEMA = "orders";
const ordersSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    }, //TODO recheck this
    address: {
      fullAdresse: String,
      state: String,
      city: String,
      postalCode: Number,
    },
    products: [
      new mongoose.Schema(
        {
          productRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: PRODUCTS_SCHEMA,
            validate: {
              validator,
              message: `ObjectId is Not valid`,
            },
          },
          options: [
            {
              optionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: OPTIONS_SCHEMA,
                validate: {
                  validator,
                  message: `ObjectId is Not valid`,
                },
              },
              values: [
                {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "options.values",
                  validate: {
                    validator,
                    message: `ObjectId is Not valid`,
                  },
                },
              ],
            },
          ],
          quantity: {
            type: Number,
            min: 1,
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
    //with shipping included
    totalPrice: { type: Number, required: true, min: 0 },
    state: { type: String, required: true, enum: ordersStates },
  },
  { versionKey: false, timestamps: true }
);
// ordersSchema.pre("save", async function (this: any, next: any) {
//   try {
//     const designIds: string[] = [];
//     this.designs.forEach((design: IOrderRequest) => {
//       designIds.push(design.designRef);
//     });

//     await ProductModel.update(
//       { _id: { $in: designIds } },
//       { $inc: { numberOfOrders: 1 } },
//       { multi: true }
//     );
//   } catch (error) {
//     console.log(error);
//   }
//   next();
// });
// ordersSchema.post("findOneAndDelete", async function (doc: any) {
//   try {
//     const designIds: string[] = [];
//     doc.designs.forEach((design: IOrderRequest) => {
//       designIds.push(design.designRef);
//     });
//     await ProductModel.update(
//       { _id: { $in: designIds } },
//       { $inc: { numberOfOrders: -1 } },
//       { multi: true }
//     );
//   } catch (error) {
//     console.log(error);
//   }
// });

const OrdersModel = mongoose.model<IOrder>(ORDERS_SCHEMA, ordersSchema);
function validateOrder(order: IOrder): Joi.ValidationResult {
  const schema = Joi.object({
    address: Joi.object({
      fullAdresse: Joi.string().required(),
      state: Joi.string().required(),
      city: Joi.string().required(),
      postalCode: Joi.number().required(),
    }).required(),
    products: Joi.array().items(
      Joi.object({
        productRef: Joi.string().required(),
        options: Joi.array().items(
          Joi.object({
            optionId: Joi.string(),
            values: Joi.array().items(Joi.string()),
          })
        ),
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
