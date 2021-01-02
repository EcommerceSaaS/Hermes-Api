import { OAuth2Strategy, IOAuth2StrategyOption } from "passport-google-oauth";
import { callback } from "./AuthCallback";
const params: IOAuth2StrategyOption = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
};
export const googleStrategy = new OAuth2Strategy(params, callback);
