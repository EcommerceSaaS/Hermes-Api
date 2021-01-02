import mongoose from "mongoose";
import Joi from "@hapi/joi";
import { IProductType } from "./IProductType";
import { validator } from "../../utils/utils";
import { COLORS_SCHEMA } from "../colors/ColorModel";
import { SIZES_SCHEMA } from "../sizes/SizeModel";
import { MATTERS_SCHEMA } from "../matters/MatterModel";
export const PRODUCT_TYPES_SCHEMA = "productTypes";
const productTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    colors: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: COLORS_SCHEMA,
          validate: {
            validator,
            message: `ObjectId is Not valid`,
          },
        },
      ],
      required: true,
    },
    sizes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: SIZES_SCHEMA,
          validate: {
            validator,
            message: `ObjectId is Not valid`,
          },
        },
      ],
      required: true,
    },
    matters: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: MATTERS_SCHEMA,
          validate: {
            validator,
            message: `ObjectId is Not valid`,
          },
        },
      ],
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);
export const productTypeModel = mongoose.model<IProductType>(
  PRODUCT_TYPES_SCHEMA,
  productTypeSchema
);
export function validateProductType(
  params: IProductType
): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    active: Joi.boolean(),
    colors: Joi.array().min(1).required(),
    sizes: Joi.array().min(1).required(),
    matters: Joi.array().min(1).required(),
  });
  return schema.validate(params);
}
