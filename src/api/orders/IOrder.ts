import { Document } from "mongoose";
import { IAddress } from "../users/IUser";

export interface IOrder extends Document {
  address: IAddress;
  products: IOrderRequest[];
  subTotalPrice: number;
  totalPrice: number;
  state: string;
  promoCode: string;
  userId?: string;
}
export interface IOrderRequest {
  productRef: string;
  // if singleChoice is true only the price of the first value
  // is applied otherwise if not singleChoice all values prices will be
  // added to the product base price
  options: { optionId: string; values: string[] }[];
  quantity: number;
}
