import mongoose from "mongoose";
import Joi from "@hapi/joi";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import { IAdmin } from "./IAdmin";
const adminSchema = new mongoose.Schema(
  {
    name: {
      trim: true,
      type: String,
      required: true,
      minlength: 5,
      maxlength: 50,
    },
    email: {
      lowercase: true,
      trim: true,
      type: String,
      unique: true,
      minlength: 5,
      maxlength: 50,
    },
    password: {
      type: String,
      minlength: 8,
    },
    default: {
      type: Boolean,
      default: false,
    },
    bannerImages: [{ type: String }],
  },
  { versionKey: false }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
adminSchema.pre("save", async function (this: any, next: any) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password.trim(), 10);
  next();
});
adminSchema.methods.sign = function () {
  const token = jsonwebtoken.sign(
    {
      id: this._id,
    },
    process.env.JWT_PRIVATE_KEY,
    { expiresIn: "90 days" }
  );
  return token;
};
adminSchema.methods.adminProfileView = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    active: this.active,
    bannerImages: this.bannerImages,
    token: this.sign(),
  };
};
adminSchema.methods.basicInfo = function () {
  return {
    name: this.name,
    email: this.email,
    bannerImages: this.bannerImages,
    shippingPrice: this.shippingPrice,
  };
};
export const adminModel = mongoose.model<IAdmin>("admin", adminSchema);
export function validateAdmin(admin: IAdmin): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(5).max(50).required(),
  });
  return schema.validate(admin);
}
