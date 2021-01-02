import { Document } from "mongoose";
export interface IColor extends Document {
  name: string;
  value: string;
  active: boolean;
}
