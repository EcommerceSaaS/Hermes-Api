import mongoose from "mongoose";
import { validator } from "../../utils/utils";
export const PRODUCT_TYPES_RESSOURCE_MODEL_NAME = "product-type-ressource";
import { PRODUCT_TYPES_MODEL_NAME } from "../product-type/ProductTypeModel";
import { COLORS_MODEL_NAME } from "../colors/ColorModel";
import { MATTERS_MODEL } from "../matters/MatterModel";
import { SIZES_MODEL_NAME } from "../sizes/SizeModel";
const schema = new mongoose.Schema(
  {
    productTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: PRODUCT_TYPES_MODEL_NAME,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    sizeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: SIZES_MODEL_NAME,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    matterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MATTERS_MODEL,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    colorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: COLORS_MODEL_NAME,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
  },
  { timestamps: true, _id: false, versionKey: false }
);
export const ProductTypeRessource = mongoose.model(
  PRODUCT_TYPES_RESSOURCE_MODEL_NAME,
  schema
);
