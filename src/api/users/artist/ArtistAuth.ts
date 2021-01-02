import { Router, Request, Response } from "express";
import { getMulterFields } from "../../../config/multerConfig";
import { handleUserSignUp } from "../UserController";
import passport from "passport";
import { validateArtist } from "../UserModel";
import { MulterError } from "multer";
import {
  sendBadRequestResponse,
  sendCreatedResponse,
  sendErrorResponse,
} from "../../../services/http/Responses";
export class ArtistRoute {
  public router: Router;
  private multer = getMulterFields();
  constructor() {
    this.router = Router();
    this.mountRoutes();
  }
  private mountRoutes() {
    this.router.post("/sign_up", (req: Request, res: Response) => {
      this.multer(req, res, async (err: MulterError) => {
        if (err) return sendErrorResponse(res, err);
        try {
          const params = [
            "name",
            "email",
            "phone",
            "adresse",
            "password",
            "socialMedia",
            "rating",
            "description",
            "isArtist",
            "storeName",
            "portfolio",
          ];
          req.body.isArtist = true;
          const user: any = await handleUserSignUp(req, params, validateArtist);
          if (user.error) return sendBadRequestResponse(res, user.error);
          sendCreatedResponse(res, user.artistProfileView());
        } catch (error) {
          if (error.code && error.code == 11000)
            return sendBadRequestResponse(
              res,
              "This email has already been used"
            );
          return sendErrorResponse(res, error);
        }
      });
    });
    this.router.post("/login", (req: Request, res: Response, next: any) => {
      passport.authenticate("local", function (err, user, info) {
        if (info) return res.status(401).send(info);
        res.send(user.artistProfileView());
      })(req, res, next);
    });
  }
}

export const artistRouter = new ArtistRoute().router;
