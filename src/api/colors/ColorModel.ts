import mongoose from "mongoose";
import Joi from "@hapi/joi";
import { IColor } from "./IColor";
export const COLORS_SCHEMA = "colors";
const colorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    value: {
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

export const Color = mongoose.model<IColor>(COLORS_SCHEMA, colorSchema);
export function validateColor(color: IColor): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    value: Joi.string().min(4).max(8).required(),
    active: Joi.boolean(),
  });
  return schema.validate(color);
}
