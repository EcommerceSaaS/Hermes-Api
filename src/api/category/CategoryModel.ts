import mongoose from "mongoose";
import Joi from "@hapi/joi";
import { ICategory } from "./ICategory";
export const CATEGORIES_SCHEMA = "categories";
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    pubPhoto: {
      type: String,
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
    pubPhoto: Joi.string(),
    active: Joi.boolean(),
  });
  return schema.validate(cateogory);
}
