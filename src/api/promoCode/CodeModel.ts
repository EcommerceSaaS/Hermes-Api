import mongoose from "mongoose";
import { validator } from "../../utils/utils";
import { ICode } from "./ICode";
import Joi from "@hapi/joi";
const salesTypes = ["Percentage", "Amount"];
export const CODES_SCHEMA = "codes";
const codeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 50,
    },
    code: {
      type: String,
      uppercase: true,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
      maxlength: 10,
    },
    kind: {
      type: String,
      required: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: salesTypes,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    activationDate: {
      type: Date,
      required: true,
      default: Date.now(),
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    design: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designs",
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
  },
  { versionKey: false, strict: true }
);
export const CodeModel = mongoose.model<ICode>(CODES_SCHEMA, codeSchema);
export function validateCode(
  promoCode: ICode,
  code: boolean
): Joi.ValidationResult {
  const schemaPromoCode = Joi.object().keys({
    name: Joi.string().min(5).max(50).required(),
    code: Joi.string().min(3).max(10).required(),
    type: Joi.string()
      .valid(...salesTypes)
      .required(),
    amount: Joi.number().required(),
    activationDate: Joi.date(),
    expirationDate: Joi.date().required(),
    artist: Joi.string().required(),
    design: Joi.string(),
    category: Joi.string(),
  });
  const schemaReduction = Joi.object().keys({
    name: Joi.string().min(5).max(50).required(),
    type: Joi.string()
      .valid(...salesTypes)
      .required(),
    amount: Joi.number().required(),
    activationDate: Joi.date(),
    expirationDate: Joi.date().required(),
    artist: Joi.string().required(),
    design: Joi.string(),
    category: Joi.string(),
  });
  return code
    ? schemaPromoCode.validate(promoCode)
    : schemaReduction.validate(promoCode);
}
