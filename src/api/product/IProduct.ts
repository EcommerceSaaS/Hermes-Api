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
  //this is the price after the values prices were added to the bese price
  price: number;
  options: string[] | IOption[];
}
