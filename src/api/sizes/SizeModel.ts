import mongoose from "mongoose";
import Joi from "@hapi/joi";
import { ISize } from "./ISize";
export const SIZES_SCHEMA = "sizes";
const sizeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);
export const Size = mongoose.model(SIZES_SCHEMA, sizeSchema);
export function validateSize(size: ISize): Joi.ValidationResult {
  const schema = Joi.object({
    code: Joi.string().trim().min(1).max(50).required(),
    description: Joi.string().trim().min(1).max(255).required(),
    active: Joi.boolean(),
  });
  return schema.validate(size);
}
