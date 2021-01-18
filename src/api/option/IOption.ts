import { Document } from "mongoose";
export interface IValue {
  name: string;
  price: number;
}

export interface IOption extends Document {
  name: string;
  singleChoice: boolean;
  values: IValue[];
}
