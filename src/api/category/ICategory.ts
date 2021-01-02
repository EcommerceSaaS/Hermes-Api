import { Document } from "mongoose";
import { IProductType } from "../product-type/IProductType";
export interface ICategory extends Document {
  id: string;
  name: string;
  pubPhoto: string;
  productTypes: IProductType[];
  active: boolean;
}
