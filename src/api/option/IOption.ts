import { Document } from "mongoose";
export interface IOption extends Document {
  name: string;
  values: string[];
}
