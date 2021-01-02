import { Document } from "mongoose";
export interface IProductTypeDesign {
  productTypeRef: string;
  matter: string;
  productTypePhoto: string;
  colors: string[];
}

export interface IDesign extends Document {
  name: string;
  description: string;
  designPhotos: string[];
  categories: string[];
  collections: string[];
  artistId: string;
  totalPrice: number;
  priceAfterReduction: number;
  price: number;
  productTypes: Array<IProductTypeDesign>;
}
