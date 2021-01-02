import mongoose from "mongoose";
import Joi from "@hapi/joi";
import { ICategory } from "./ICategory";
import { validator } from "../../utils/utils";
import { PRODUCT_TYPES_SCHEMA } from "../product-type/ProductTypeModel";
export const CATEGORIES_SCHEMA = "categories";
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    productTypes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: PRODUCT_TYPES_SCHEMA,
          validate: {
            validator,
            message: `ObjectId is Not valid`,
          },
        },
      ],
      required: true,
    },
    pubPhoto: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { versionKey: false, timestamps: true }
);
export const Category = mongoose.model<ICategory>(
  CATEGORIES_SCHEMA,
  categorySchema
);
export function validateCategory(cateogory: ICategory): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(20).required(),
    productTypes: Joi.array().min(1).required(),
    pubPhoto: Joi.string(),
    active: Joi.boolean(),
  });
  return schema.validate(cateogory);
}
