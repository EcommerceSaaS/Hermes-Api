import mongoose from "mongoose";
import { IProduct } from "./IProduct";
import Joi from "@hapi/joi";
import { validator } from "../../utils/utils";
import { COLLECTIONS_SCHEMA } from "../collection/CollectionModel";
import { PRODUCT_TYPES_SCHEMA } from "../product-type/ProductTypeModel";
import { MATTERS_SCHEMA } from "../matters/MatterModel";
import { COLORS_SCHEMA } from "../colors/ColorModel";
import { CATEGORIES_SCHEMA } from "../category/CategoryModel";
import { USERS_SCHEMA } from "../users/UserModel";
import { REVIEWS_SCHEMA } from "../reviews/ReviewModel";
const designStates = ["inactive", "active", "archived"];
export const DESIGNS_SCHEMA = "Designs";
const designSchema = new mongoose.Schema(
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
    totalPrice: {
      type: Number,
      min: 0,
      required: true,
    },
    state: {
      type: String,
      enum: designStates,
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
    productTypes: [
      new mongoose.Schema(
        {
          productTypeRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: PRODUCT_TYPES_SCHEMA,
            validate: {
              validator,
              message: `ObjectId is Not valid`,
            },
          },
          matter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: MATTERS_SCHEMA,
            validate: {
              validator,
              message: `ObjectId is Not valid`,
            },
          },
          colors: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: COLORS_SCHEMA,
              validate: {
                validator,
                message: `ObjectId is Not valid`,
              },
            },
          ],
          productTypePhoto: {
            type: String,
            required: true,
          },
        },
        { _id: false }
      ),
    ],
    numberOfOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: USERS_SCHEMA,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
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
export const ProductModel = mongoose.model<IProduct>("Designs", designSchema);

export function validateDesign(design: IProduct): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(10).max(255).required(),
    designPhotos: Joi.array().items(Joi.string()).min(1).required(),
    categories: Joi.array().items(Joi.string()).min(1).required(),
    artistId: Joi.any().required(),
    collections: Joi.array().items(Joi.string()),
    productTypes: Joi.array()
      .items(
        Joi.object({
          productTypeRef: Joi.string().required(),
          matter: Joi.string().required(),
          productTypePhoto: Joi.string().required(),
          colors: Joi.array().items(Joi.string()).min(1),
        })
      )
      .min(1)
      .required(),
  });
  return schema.validate(design);
}
