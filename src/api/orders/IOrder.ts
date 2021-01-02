import { Document } from "mongoose";

export interface IOrder extends Document {
  address: {
    fullAdresse: string;
    state: string;
    city: string;
    postalCode: number;
  };
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
