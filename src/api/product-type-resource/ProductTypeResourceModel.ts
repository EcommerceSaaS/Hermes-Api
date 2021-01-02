import mongoose from "mongoose";
import { validator } from "../../utils/utils";
import { PRODUCT_TYPES_SCHEMA } from "../product-type/ProductTypeModel";
import { COLORS_SCHEMA } from "../colors/ColorModel";
import { MATTERS_SCHEMA } from "../matters/MatterModel";
import { SIZES_SCHEMA } from "../sizes/SizeModel";
export const PRODUCT_TYPES_RESSOURCE_SCHEMA = "product-type-ressource";
const schema = new mongoose.Schema(
  {
    productTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: PRODUCT_TYPES_SCHEMA,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    sizeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: SIZES_SCHEMA,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    matterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MATTERS_SCHEMA,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
    colorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: COLORS_SCHEMA,
      validate: {
        validator,
        message: `ObjectId is Not valid`,
      },
    },
  },
  { timestamps: true, _id: false, versionKey: false }
);
export const ProductTypeRessource = mongoose.model(
  PRODUCT_TYPES_RESSOURCE_SCHEMA,
  schema
);
