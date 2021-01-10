import mongoose from "mongoose";
import { IReview } from "./IReview";
import Joi from "@hapi/joi";
import { validator } from "../../utils/utils";
import { PRODUCTS_SCHEMA } from "../product/ProductsModel";
export const REVIEWS_SCHEMA = "reviews";
const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
<<<<<<< HEAD
      ref: "products",
=======
      ref: PRODUCTS_SCHEMA,
>>>>>>> 219b5e56896d706a0035a87b3e98d76e46aa3dce
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      required: true,
      default: 0,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);
export const reviewModel = mongoose.model<IReview>(
  REVIEWS_SCHEMA,
  reviewSchema
);
export function validateReview(review: IReview): Joi.ValidationResult {
  const schema = Joi.object({
    rating: Joi.number().min(0).max(5).required(),
    comment: Joi.string().min(0).max(255).required(),
    productId: Joi.string().required(),
  });
  return schema.validate(review);
}
