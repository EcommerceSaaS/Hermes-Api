import { Document } from "mongoose";

export interface IAdmin extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  default: boolean;
  active: boolean;
  bannerImages: Array<string>;
  adminProfileView(): any;
  basicInfo(): any;
}
