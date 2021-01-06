import { Document } from "mongoose";
export interface IValue extends Document {
  name: string;
  image?: string;
  price: number;
  optionId: string;
}
