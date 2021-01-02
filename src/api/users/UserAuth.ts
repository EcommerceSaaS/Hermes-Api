import { Router, Response, Request, RequestHandler } from "express";
import passport from "passport";
import { handleUserSignUp } from "./UserController";
import { validateUser } from "./UserModel";
import { getMulterFields } from "../../config/multerConfig";
import { MulterError } from "multer";
import {
  sendBadRequestResponse,
  sendErrorResponse,
  sendCreatedResponse,
} from "../../services/http/Responses";
import { omit } from "lodash";
import { facebook } from "../../services/auth/tokenManager/Facebook";
import { callback } from "../../services/auth/strategies/AuthCallback";
import { google } from "../../services/auth/tokenManager/Google";
class AuthManager {
  public router: Router;
  private multer: RequestHandler;
  constructor() {
    this.multer = getMulterFields();
    this.router = Router();
    this.mountRoutes();
  }
  private mountRoutes() {
    this.router.get("/google", async (req: Request, res: Response) => {
      const accessToken = req.query.access_token;
      try {
        const profile = await google(accessToken);
        callback(accessToken, null, profile, (err, user) => {
          if (err) return sendErrorResponse(res, err);
          const result = omit(user.toJSON(), [
            "isAdmin",
            "isArtist",
            "active",
            "tokens",
          ]);
          result.token = user.sign();
          res.send(result);
        });
      } catch (error) {
        sendErrorResponse(res, error);
      }
    });
    this.router.get("/facebook", async (req: Request, res: Response) => {
      const accessToken = req.query.access_token;
      try {
        const profile = await facebook(accessToken);
        callback(accessToken, null, profile, (err, user) => {
          if (err) return sendErrorResponse(res, err);
          const result = omit(user.toJSON(), [
            "isAdmin",
            "isArtist",
            "active",
            "tokens",
          ]);
          result.token = user.sign();
          res.send(result);
        });
      } catch (error) {
        sendErrorResponse(res, error);
      }
    });
    this.router.post("/login", (req, res, next) => {
      passport.authenticate("local", function (err, user, info) {
        if (info) return res.status(401).send(info);
        res.send(user.userProfileView());
      })(req, res, next);
    });
    this.router.post("/sign_up", (req, res) => {
      this.multer(req, res, async (err: MulterError) => {
        try {
          if (err)
            return sendBadRequestResponse(
              res,
              `${err.message} check images json keys`
            );
          const keys = ["name", "email", "phone", "adresse", "password"];
          const user: any = await handleUserSignUp(req, keys, validateUser);
          if (user.error) return sendBadRequestResponse(res, user.error);
          sendCreatedResponse(res, user.userProfileView());
        } catch (error) {
          if (error.code && error.code == 11000)
            return sendBadRequestResponse(
              res,
              "This email is already being used"
            );
          console.log(err);
          sendErrorResponse(res, error);
        }
      });
    });
  }
}
export const authRouter = new AuthManager().router;
