import { Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  productPhotos: string[];
  categories: string[];
  collections: string[];
  artistId: string;
  basePrice: number;
  priceAfterReduction: number;
  price: number;
  options: string[];
}
