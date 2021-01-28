import { Request, Response, Router, RequestHandler } from "express";
import auth from "../../services/middlewares/Auth";
import { pick } from "lodash";
import { ObjectID } from "mongodb";
import { updateUser, deleteUser, getUsers, getUser } from "./UserController";
import moment from "moment";
import { authRouter } from "./UserAuth";
import { getGFS } from "../../config/DataBaseConnection";
import { getMulterFields } from "../../config/multerConfig";
import { MulterError } from "multer";
import jwt from "jsonwebtoken";
import {
  sendErrorResponse,
  sendOKResponse,
  sendBadRequestResponse,
} from "../../services/http/Responses";
import { extractFilesFromRequestFields } from "../../utils/utils";
import { productsRouter } from "../product/ProductsRoute";
import { omit } from "lodash";
import { adminRouter } from "../admin/AdminRoutes";
import { categoriesRouter } from "../category/CategoryRoute";
import { IUser } from "./IUser";
class UserRoute {
  public router: Router;
  private multer: RequestHandler;
  constructor() {
    this.multer = getMulterFields();
    this.router = Router();
    this.mountRoutes();
  }
  private mountRoutes() {
    this.router.use("/:userId/products", productsRouter);
    this.router.use("/:userId/categories", categoriesRouter);
    this.router.use("/auth", authRouter);
    this.router.use("/admins", adminRouter);
    this.router.get(
      "/",
      // [auth, artist],
      async (req: Request, res: Response) => {
        let { limit, page, sort, start, end, q } = req.query;
        const { active } = req.query;
        limit = Number(limit) || 10;
        page = Number(page) || 1;
        sort = Number(sort);
        q = q || "";
        end = end && moment(end, "YYYY-MM-DD").toDate();
        start = start && (start = moment(start, "YYYY-MM-DD").toDate());
        try {
          const result = await getUsers(
            q,
            limit,
            page,
            sort ? sort : -1,
            start,
            end,
            active
          );
          sendOKResponse(res, { users: result[0], count: result[1] });
        } catch (error) {
          sendErrorResponse(res, error);
        }
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.router.get("/me/", auth, async (req: any, res: Response) => {
      try {
        const user = await getUser(req.user.id);
        sendOKResponse(res, user);
      } catch (error) {
        sendErrorResponse(res, error);
      }
    });
    this.router.get("/verify_token/", (req: Request, res: Response) => {
      try {
        const decoded = jwt.verify(
          req.query.token,
          process.env.JWT_PRIVATE_KEY
        );
        if (decoded) return sendOKResponse(res, "Valid token");
      } catch (error) {
        sendErrorResponse(res, error);
      }
    });

    this.router.get(
      "/:userId",
      // [auth, artist],
      async (req: Request, res: Response) => {
        try {
          const id = req.params.userId;
          const user = await getUser(id);
          if (user) return sendOKResponse(res, omit(user, ["password"]));

          sendBadRequestResponse(res, "There's no user with such id");
        } catch (error) {
          sendErrorResponse(res, error);
        }
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.router.put("/:id", [auth], async (req: any, res: Response) => {
      this.multer(req, res, async (err: MulterError) => {
        if (err) return sendErrorResponse(res, err);
        const userId = req.params.id;
        if (!ObjectID.isValid(userId))
          return sendBadRequestResponse(res, "user id not valid");
        let params = [];
        if (req.user.isArtist) {
          params = [
            "name",
            "phone",
            "profilePicture",
            "profileBanner",
            "adresse",
            "isArtist",
            "socialMedia",
            "description",
            "active",
            "storeName",
            "portfolio",
          ];
        } else
          params = ["name", "phone", "profilePicture", "active", "adresse"];
        let user: IUser = pick(req.body, params) as IUser;
        try {
          const photos = extractFilesFromRequestFields(req);
          user = await updateUser(userId, user, photos);
          const newUser = pick(user, [
            "active",
            "orders",
            "_id",
            "name",
            "email",
            "socialMedia",
            "description",
            "storeName",
            "portfolio",
            "adresse",
            "phone",
            "profileBanner",
            "profilePhoto",
          ]);

          if (user) return sendOKResponse(res, newUser);
          sendBadRequestResponse(res, "There's no user with such id");
        } catch (error) {
          sendErrorResponse(res, error);
        }
      });
    });
    this.router.delete("/:id", async (req: Request, res: Response) => {
      try {
        const userId = req.params.id;
        if (!ObjectID.isValid(userId))
          return sendBadRequestResponse(res, "User id not valid");
        const user = await deleteUser(userId);
        if (user) {
          const gfs = getGFS();
          [user?.profilePhoto, user?.profileBanner].forEach((element) => {
            gfs.remove({ filename: element, root: "uploads" }, (err) => {
              console.log(err);
            });
          });
          sendOKResponse(res, omit(user, ["password"]));
        } else sendBadRequestResponse(res, "There's no user with such id");
      } catch (error) {
        sendErrorResponse(res, error);
      }
    });
  }
}
export const userRouter = new UserRoute().router;
