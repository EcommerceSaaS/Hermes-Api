import mongoose from "mongoose";
import { IValue } from "./IValue";
import { validator } from "../../../utils/utils";
import { OPTIONS_SCHEMA } from "../OptionsModel";
import Joi from "@hapi/joi";
export const VALUES_SCHEMA = "values";
const valueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 10,
    },
    optionId: {
      type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: OPTIONS_SCHEMA,
        validate: {
          validator,
          message: `ObjectId is Not valid`,
        },
      },
    },
    image: {
      type: String,
    },
    price: { type: Number, required: true, min: 0 },
  },
  { versionKey: false, timestamps: true }
);
export function validateValue(value: IValue): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
  });
  return schema.validate(value);
}
export const ValuesModel = mongoose.model<IValue>(VALUES_SCHEMA, valueSchema);
