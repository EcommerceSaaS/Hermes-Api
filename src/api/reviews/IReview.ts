import { Document } from "mongoose";
export interface IReview extends Document {
  createdAt: string;
  userId: string;
  designId: string;
  rating: number;
  comment: string;
}
