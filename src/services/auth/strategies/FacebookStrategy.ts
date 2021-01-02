import { Strategy, StrategyOption } from "passport-facebook";
import { callback } from "./AuthCallback";

const params: StrategyOption = {
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL,
  profileFields: [
    "id",
    "displayName",
    "email",
    "name",
    "gender",
    "picture.type(large)",
  ],
};
export const facebookStrategy = new Strategy(params, callback);
