import passport from "passport";
import {
  userLocalStrategy,
  adminLocalStrategy,
} from "./strategies/LocalStrategy";

export function initializeAuth(): void {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });

  passport.use("local", userLocalStrategy);
  passport.use("admin", adminLocalStrategy);
}
