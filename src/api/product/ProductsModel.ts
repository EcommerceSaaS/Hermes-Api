import mongoose from "mongoose";
import { IProduct } from "./IProduct";
import Joi from "@hapi/joi";
import { validator } from "../../utils/utils";
import { COLLECTIONS_SCHEMA } from "../collection/CollectionModel";
import { CATEGORIES_SCHEMA } from "../category/CategoryModel";
import { USERS_SCHEMA } from "../users/UserModel";
import { REVIEWS_SCHEMA } from "../reviews/ReviewModel";
import { OPTIONS_SCHEMA } from "../option/OptionsModel";
const productStates = ["inactive", "active", "archived"];
export const PRODUCTS_SCHEMA = "products";
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: 3,
      maxlength: 50,
      required: true,
    },
    description: {
      type: String,
      minlength: 10,
      maxlength: 255,
    },
    designPhotos: [String],
    basePrice: {
      type: Number,
      min: 0,
      required: true,
    },
    state: {
      type: String,
      enum: productStates,
      default: "inactive",
      required: true,
    },
    collections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: COLLECTIONS_SCHEMA,
        validate: {
          validator,
          message: `ObjectId is Not valid`,
        },
      },
    ],
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: CATEGORIES_SCHEMA,
        validate: {
          validator,
          message: `ObjectId is Not valid`,
        },
      },
    ],
    options: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: OPTIONS_SCHEMA,
        validate: {
          validator,
          message: `ObjectId is Not valid`,
        },
      },
    ],
    numberOfOrders: {
      type: Number,
      default: 0,
      min: 0,
    },

    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: REVIEWS_SCHEMA,
        validate: {
          validator,
          message: `ObjectId is Not valid`,
        },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);
export const ProductModel = mongoose.model<IProduct>(
  PRODUCTS_SCHEMA,
  productSchema
);

export function validateProduct(product: IProduct): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(10).max(255).required(),
    basePrice: Joi.number().required(),
    designPhotos: Joi.array().items(Joi.string()).min(1).required(),
    categories: Joi.array().items(Joi.string()).min(1).required(),
    collections: Joi.array().items(Joi.string()),
    // options: Joi.array().items(Joi.string()).min(1).required(),
    options: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          values: Joi.array()
            .items(
              Joi.object({
                name: Joi.string().required(),
                price: Joi.number().required(),
              })
            )
            .min(1)
            .required(),
        })
      )
      .required(),
  });
  return schema.validate(product);
}
