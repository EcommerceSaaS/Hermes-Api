import mongoose from "mongoose";
import Joi from "@hapi/joi";
import { IUser } from "./IUser";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import { urlPattern } from "../../utils/utils";
import { validator } from "../../utils/utils";
import { ORDERS_SCHEMA } from "../orders/OrdersModel";
import { PRODUCTS_SCHEMA } from "../product/ProductsModel";
import { REVIEWS_SCHEMA } from "../reviews/ReviewModel";
export const USERS_SCHEMA = "User";
const userSchema = new mongoose.Schema(
  {
    name: {
      trim: true,
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    storeName: {
      type: String,
      trim: true,
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
    portfolio: {
      type: String,
      trim: true,
    },
    phone: [{ type: String, minlength: 5, maxlength: 50, trim: true }],
    adresse: new mongoose.Schema({
      fullAdresse: String,
      state: String,
      city: String,
      postalCode: Number,
    }),
    password: {
      type: String,
      minlength: 8,
    },
    socialMedia: [
      {
        name: {
          type: String,
          required: true,
        },
        link: {
          type: String,
          required: true,
        },
      },
    ],
    description: {
      type: String,
      trim: true,
      minlength: 10,
      maxlength: 255,
    },
    isArtist: {
      type: Boolean,
      default: false,
    },
    profilePhoto: {
      type: String,
    },
    profileBanner: {
      type: String,
    },
    active: {
      type: Boolean,
      default: false, //true indicates active
    },
    designs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: PRODUCTS_SCHEMA,
        validate: {
          validator,
          message: `ObjectId is Not valid`,
        },
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: ORDERS_SCHEMA,
        validate: {
          validator,
          message: `ObjectId is Not valid`,
        },
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: REVIEWS_SCHEMA,
        validate: {
          validator,
          message: `ObjectId is Not valid`,
        },
      },
    ],
    provider: String,
  },
  {
    versionKey: false,
    timestamps: true,
  }
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
userSchema.pre("save", async function (this: any, next: any) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password.trim(), 10);
  next();
});
userSchema.methods.sign = function () {
  const token = jsonwebtoken.sign(
    {
      id: this._id,
      isArtist: this.isArtist,
      active: this.active,
    },
    process.env.JWT_PRIVATE_KEY,
    { expiresIn: "90 days" }
  );
  return token;
};
userSchema.methods.userProfileView = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    adresse: this.adresse,
    profilePhoto: this.profilePhoto,
    profileBanner: this.profileBanner,
    token: this.sign(),
  };
};
userSchema.methods.artistProfileView = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    adresse: this.adresse,
    portfolio: this.portfolio,
    storeName: this.storeName,
    profilePhoto: this.profilePhoto,
    profileBanner: this.profileBanner,
    socialMedia: this.socialMedia,
    description: this.description,
    provider: this.provider,
    token: this.sign(),
  };
};

export const User = mongoose.model<IUser>(USERS_SCHEMA, userSchema);

export function validateUser(user: IUser): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.array().items(Joi.string()).min(1).required(),
    password: Joi.string().min(5).max(50).required(),
    adresse: Joi.object().keys({
      fullAdresse: Joi.string().required(),
      state: Joi.string().required(),
      city: Joi.string().required(),
      postalCode: Joi.number().required(),
    }),
    // .required(),
    profilePhoto: Joi.string().required(),
  }).unknown();
  return schema.validate(user);
}

export function validateArtist(artist: IUser): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    storeName: Joi.string().min(5).max(255).required(),
    portfolio: Joi.string().regex(urlPattern).required(),
    phone: Joi.array().items(Joi.string()).min(1).required(),
    password: Joi.string().min(5).max(50).required(),
    adresse: Joi.object().keys({
      fullAdresse: Joi.string().required(),
      state: Joi.string().required(),
      city: Joi.string().required(),
      postalCode: Joi.number().required(),
    }),
    socialMedia: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          link: Joi.string().regex(urlPattern).required(),
        })
      )
      .max(3),
    // .required()
    description: Joi.string().min(10).max(255).required(),
  }).unknown();
  return schema.validate(artist);
}
