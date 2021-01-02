import passport from "passport";
import { facebookStrategy } from "./strategies/FacebookStrategy";
import { googleStrategy } from "./strategies/GoogleStrategy";
import {
  userLocalStrategy,
  adminLocalStrategy,
} from "./strategies/LocalStrategy";

export function initializeAuth() {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });
  passport.use("facebook", facebookStrategy);
  passport.use("google", googleStrategy);
  passport.use("local", userLocalStrategy);
  passport.use("admin", adminLocalStrategy);
}
