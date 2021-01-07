import mongoose from "mongoose";
import { IOption } from "./IOption";
import Joi from "@hapi/joi";
export const OPTIONS_SCHEMA = "options";
const optionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      min: 3,
      max: 10,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    values: [
      new mongoose.Schema(
        {
          name: {
            type: String,
            minlength: 3,
            required: true,
            maxlength: 10,
          },
          price: {
            type: Number,
            min: 0,
            required: true,
          },
        },
        { _id: true, versionKey: false, timestamps: true }
      ),
    ],
  },
  { versionKey: false, timestamps: true }
);
export function validateOption(option: IOption): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(10).required(),
    values: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          price: Joi.number().required(),
        })
      )
      .min(1)
      .required(),
  });
  return schema.validate(option);
}
export const OptionsModel = mongoose.model<IOption>(
  OPTIONS_SCHEMA,
  optionSchema
);
