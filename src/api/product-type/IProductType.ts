import { Document } from "mongoose";
export interface IProductType extends Document {
  name: string;
  price: number;
  active: boolean;
  colors: string[];
  sizes: string[];
  matters: string[];
}
