import { Strategy } from "passport-local";
import { User } from "../../../api/users/UserModel";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { IAdmin } from "../../../api/admin/IAdmin";
import { IUser } from "../../../api/users/IUser";
import { adminModel } from "../../../api/admin/AdminModel";
function generateLocalStrategyBasedOnModel(
  Model: mongoose.Model<IAdmin | IUser>
) {
  return new Strategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await Model.findOne({
          email,
        });
        if (user) {
          const compareResult = await bcrypt.compare(password, user.password);
          if (compareResult) {
            const exist = await adminModel.exists({ _id: user._id });
            if (user.active == true || exist) return done(null, user);
            else if (user.active == false)
              return done(null, false, {
                message: "Your account has not been activated yet !",
              });
          }
          return done(null, false, {
            message: "Incorrect credentials",
          });
        } else {
          return done(null, false, {
            message: "There's no user with such email/password combination",
          });
        }
      } catch (error) {
        if (error) {
          return done(null, false, { message: "Auth failed" });
        }
      }
    }
  );
}

export const userLocalStrategy = generateLocalStrategyBasedOnModel(User);
export const adminLocalStrategy = generateLocalStrategyBasedOnModel(adminModel);
