import mongoose from "mongoose";
import { IOption } from "./IOption";
import { validator } from "../../utils/utils";
import { VALUES_SCHEMA } from "./values/ValuesModel";
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
    values: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: VALUES_SCHEMA,
          validate: {
            validator,
            message: `ObjectId is Not valid`,
          },
        },
      ],
      min: 1,
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);
export function validateOption(option: IOption): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(10).required(),
    values: Joi.array().items(Joi.string()).min(1).required(),
  });
  return schema.validate(option);
}
export const OptionsModel = mongoose.model<IOption>(
  OPTIONS_SCHEMA,
  optionSchema
);
