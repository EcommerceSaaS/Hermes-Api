import mongoose from "mongoose";
import { validator } from "../../utils/utils";
import { ICode } from "./ICode";
import Joi from "@hapi/joi";
import { PRODUCTS_SCHEMA } from "../product/ProductsModel";
import { CATEGORIES_SCHEMA } from "../category/CategoryModel";
const salesTypes = ["Percentage", "Amount"];
export enum codeTypes {
  promoCode = "PROMOCODE",
  reduction = "REDUCTION",
}

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
      enum: Object.values(codeTypes),
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: CATEGORIES_SCHEMA,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: PRODUCTS_SCHEMA,
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
  code: ICode,
  codeType: boolean
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
    product: Joi.string(),
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
    product: Joi.string(),
    category: Joi.string(),
  });
  return codeType
    ? schemaPromoCode.validate(code)
    : schemaReduction.validate(code);
}
