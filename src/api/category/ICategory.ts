import { Document } from "mongoose";
export interface ICategory extends Document {
  id: string;
  name: string;
  pubPhoto: string;
  active: boolean;
}
