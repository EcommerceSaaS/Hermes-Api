import express from "express";
import cors from "cors";
import { PORT } from "./config/Constants";
import { config } from "dotenv";
config();
import { designsRouter } from "./api/product/ProductsRoute";
import { initializeDataBase } from "./config/DataBaseConnection";
import { publicImagesRouter } from "./api/public/ImageDownloadRoute";
import { userRouter } from "./api/users/UserRoute";
import path from "path";
import passport from "passport";
import { initializeAuth } from "./services/auth/passport";
import { colorsRouter } from "./api/colors/ColorRouter";
import { sizesRouter } from "./api/sizes/SizeRouter";
import { productTypeRouter } from "./api/product-type/ProductTypeRouter";
import error from "./services/middlewares/Error";
import { categoriesRouter } from "./api/category/CategoryRoute";
import { collectionsRouter } from "./api/collection/CollectionRoutes";
import helmet from "helmet";
import compression from "compression";
import { emailRouter } from "./api/email/EmailSender";
import { promoCodeRouter } from "./api/promo-code/PromoCodeRoutes";
import { reductionRouter } from "./api/promo-code/reduction/ReductionsRoutes";
import { ordersRouter } from "./api/orders/OrdersRoutes";
import stats from "./api/stats/Stats";
import { matterRouter } from "./api/matters/MattersRoutes";
import { mainPageRouter } from "./api/Info/MainPage";
import { reviewsRouter } from "./api/reviews/ReviewRouter";
class App {
  public app: any;
  constructor() {
    initializeDataBase()
      .then(() => {
        this.app = express();
        initializeAuth();
        this.mountMiddlewares();
        this.initializeAppListener();
      })
      .catch((err) => {
        console.log(err.message);
      });
  }
  private mountMiddlewares() {
    this.app.use(passport.initialize());
    this.app.use(cors());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    // this.app.use(helmet());
    // this.app.use(compression());
    this.app.use("/uploads", express.static(path.resolve("uploads")));
    this.app.use("/designs", designsRouter);
    this.app.use("/public", publicImagesRouter);
    this.app.use("/users", userRouter);
    this.app.use("/colors", colorsRouter);
    this.app.use("/sizes", sizesRouter);
    this.app.use("/productTypes", productTypeRouter);
    this.app.use("/categories", categoriesRouter);
    this.app.use("/collections", collectionsRouter);
    this.app.use("/emails", emailRouter);
    this.app.use("/promoCodes", promoCodeRouter);
    this.app.use("/reductions", reductionRouter);
    this.app.use("/stats", stats);
    this.app.use("/orders", ordersRouter);
    this.app.use("/matters", matterRouter);
    this.app.use("/info", mainPageRouter);
    this.app.use("/reviews", reviewsRouter);
    this.app.use(error);
  }
  private initializeAppListener() {
    this.app.listen(PORT, () => {
      console.log(`Listning ... on ${PORT}`);
    });
  }
}

new App();
