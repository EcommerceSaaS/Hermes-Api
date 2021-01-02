import { Document } from "mongoose";
export interface ICode extends Document {
  name: string;
  code: string;
  kind?: string;
  type: string;
  amount: number;
  activationDate: Date;
  expirationDate: Date;
  active: boolean;
  artist: string;
  category: string;
  design: string;
}
