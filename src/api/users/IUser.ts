/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document } from "mongoose";
export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: IAddress;
  password: string;
  provider: string;
  profilePhotos: string[];
  active: boolean;
  socialMedia: { name: string; link: string }[];
  profilePhoto: string;
  profileBanner: string;
  tokens: [{ kind: string; accessToken: string; refreshToken: string }] | null;
  sign(): string;
  profileView(): any;
  artistProfileView(): any;
  userProfileView(): any;
}
export interface IAddress {
  fullAdresse: string;
  state: string;
  city: string;
  postalCode: number;
}
