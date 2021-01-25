import { Document } from "mongoose";
import { IOption } from "../option/IOption";

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
  options: string[] | IOption[];
}
