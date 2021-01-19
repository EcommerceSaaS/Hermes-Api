import { Document } from "mongoose";
import { IAddress } from "../users/IUser";

export interface IOrder extends Document {
  address: IAddress;
  designs: IOrderRequest[];
  subTotalPrice: number;
  totalPrice: number;
  state: string;
  promoCode: string;
  ownerId?: string;
}
export interface IOrderRequest {
  designRef: string;
  size: string;
  color: string;
  quantity: number;
  neckline: string;
}
