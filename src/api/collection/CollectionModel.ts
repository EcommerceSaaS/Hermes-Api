import mongoose from "mongoose";
import Joi from "@hapi/joi";
import { ICollection } from "./ICollection";
export const COLLECTIONS_SCHEMA = "collections";
const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: 3,
      maxlength: 25,
      trime: true,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    collectionImage: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);
export const Collection = mongoose.model<ICollection>(
  COLLECTIONS_SCHEMA,
  collectionSchema
);
export function validateCollection(
  collection: ICollection
): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(25).required(),
    active: Joi.boolean(),
  });
  return schema.validate(collection);
}
