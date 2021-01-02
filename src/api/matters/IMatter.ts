import { Document } from "mongoose";
export default interface IMatter extends Document {
  name: string;
  active: boolean;
}
