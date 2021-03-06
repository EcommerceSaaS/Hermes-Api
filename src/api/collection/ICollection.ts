import { Document } from "mongoose";
export interface ICollection extends Document {
  _id: string;
  name: string;
  active: boolean;
  collectionImage?: string;
}
