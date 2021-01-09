import { Document } from "mongoose";
export interface IReview extends Document {
  createdAt: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
}
