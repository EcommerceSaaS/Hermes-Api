import { Request, Response, Router } from "express";
import passport from "passport";
import { MulterError } from "multer";
import { getMulterArray } from "../../config/multerConfig";
import {
  sendBadRequestResponse,
  sendCreatedResponse,
  sendErrorResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import { validateAdmin, adminModel } from "./AdminModel";
import { pick, merge } from "lodash";
import { extractFilesFromRequestArray, removeFiles } from "../../utils/utils";
import Auth from "../../services/middlewares/Auth";
import { getGFS } from "../../config/DataBaseConnection";
import Admin from "../../services/middlewares/Admin";
import { IAdmin } from "./IAdmin";
const adminRouter = Router();
const multer = getMulterArray(8);

adminRouter.get("/", async (req, res) => {
  const info = await adminModel
    .findOne({ default: true })
    .select("bannerImages shippingPrice");
  return sendOKResponse(res, info);
});

adminRouter.post("/login", (req, res, next) => {
  passport.authenticate("admin", function (err, user, info) {
    if (info) return res.status(401).send(info);
    res.send(user.adminProfileView());
  })(req, res, next);
});
adminRouter.post("/sign_up", (req, res) => {
  multer(req, res, async (err: MulterError) => {
    try {
      if (err)
        return sendBadRequestResponse(
          res,
          `${err.message} check images json keys`
        );
      const body: IAdmin = pick(req.body, [
        "name",
        "email",
        "password",
      ]) as IAdmin;
      const { error } = validateAdmin(body);
      const files = extractFilesFromRequestArray(req);
      if (error) {
        const gfs = getGFS();
        removeFiles(gfs, files);
        return sendBadRequestResponse(res, error.details[0].message);
      }
      if (!files.length)
        return sendBadRequestResponse(
          res,
          "At least one banner Image is required"
        );
      if (files) body.bannerImages = files;
      let admin = new adminModel(body);
      admin = await admin.save();
      sendCreatedResponse(res, admin.adminProfileView());
    } catch (error) {
      if (error.code && error.code == 11000)
        return sendBadRequestResponse(res, "This email is already being used");
      console.log(err);
      sendErrorResponse(res, error);
    }
  });
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
adminRouter.put("/", [Auth], async (req: any, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) return sendErrorResponse(res, err);
    try {
      const files = extractFilesFromRequestArray(req);
      const body = pick(req.body, ["name", "imagesToDelete", "default"]);
      let user = await adminModel.findById(req.user.id);
      if (!user) return sendBadRequestResponse(res, "There's no such admin !");
      if (body.imagesToDelete) {
        user.bannerImages = user.bannerImages.filter((item) => {
          return !body.imagesToDelete.includes(item);
        });
      }
      user.bannerImages.push(...files);
      user = merge(user, body);
      await user.save();
      sendOKResponse(res, user.basicInfo());
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });
});
adminRouter.delete(
  "/:adminId",
  [Auth, Admin],
  async (req: Request, res: Response) => {
    try {
      const admin = await adminModel.findByIdAndDelete(req.params.adminId);
      if (admin) {
        const gfs = getGFS();
        removeFiles(gfs, admin.bannerImages);
        return sendOKResponse(
          res,
          pick(admin, ["name", "email", "shippingPrice", "default"])
        );
      }
      sendBadRequestResponse(res, "There's no such admin !");
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }
);
export { adminRouter };
