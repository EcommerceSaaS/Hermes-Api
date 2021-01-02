import mongoose from "mongoose";
import IMatter from "./IMatter";
export const MATTERS_SCHEMA = "matters";
const matterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: 3,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);
const MattersModel = mongoose.model<IMatter>(MATTERS_SCHEMA, matterSchema);

export { MattersModel };
