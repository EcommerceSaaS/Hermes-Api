import { Request, Response, Router } from "express";
import Auth from "../../services/middlewares/Auth";
import {
  sendErrorResponse,
  sendBadRequestResponse,
  sendCreatedResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import { pick } from "lodash";
import { validateReview, reviewModel } from "./ReviewModel";
import mongoose from "mongoose";
import { User } from "../users/UserModel";
import { ProductModel } from "../product/ProductsModel";
import { IReview } from "./IReview";
const reviewsRouter = Router({ mergeParams: true });
reviewsRouter.get("/", async (req: Request, res: Response) => {
  try {
    let reviews = null;
    if (req.params.productId) {
      reviews = await ProductModel.find({ _id: req.params.productId })
        .select("reviews")
        .populate("reviews")
        .populate({
          path: "userId",
          select: { _id: 1, name: 1, profilePhoto: 1 },
        });
      return sendOKResponse(res, reviews);
    }
    reviews = await reviewModel.find().populate([
      {
        path: "userId",
        select: { _id: 1, name: 1, profilePhoto: 1 },
      },
      {
        path: "productId",
        select: { _id: 1, name: 1 },
      },
    ]);
    sendOKResponse(res, reviews);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
reviewsRouter.post("/", [Auth], async (req: any, res: Response) => {
  try {
    const body: IReview = pick(req.body, [
      "rating",
      "comment",
      "productId",
    ]) as IReview;
    const { error } = validateReview(body);
    if (error) return sendBadRequestResponse(res, error.details[0].message);
    body.userId = req.user.id;
    let review = new reviewModel(body);
    review = await review.save();
    await Promise.all([
      User.findByIdAndUpdate(req.user.id, {
        $push: { reviews: review._id },
      }),
      ProductModel.findByIdAndUpdate(body.productId, {
        $push: { reviews: review._id },
      }),
    ]);
    sendCreatedResponse(res, review);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
reviewsRouter.put("/:reviewId", [Auth], async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.reviewId))
      return sendBadRequestResponse(res, "Not a valid review id");
    const body: IReview = pick(req.body, ["rating", "comment"]) as IReview;
    const review = await reviewModel.findByIdAndUpdate(
      req.params.reviewId,
      body,
      {
        new: true,
      }
    );
    sendOKResponse(res, review);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
reviewsRouter.delete(
  "/:reviewId/:productId",
  [Auth],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (req: any, res: Response) => {
    try {
      if (
        !mongoose.isValidObjectId(req.params.reviewId) ||
        !mongoose.isValidObjectId(req.params.productId)
      )
        return sendBadRequestResponse(res, "Not a valida review id");
      const review = await reviewModel.findByIdAndDelete(req.params.reviewId);
      await Promise.all([
        User.findByIdAndUpdate(req.user.id, {
          $pull: { reviews: review._id },
        }),
        ProductModel.findByIdAndUpdate(req.params.productId, {
          $pull: { reviews: review._id },
        }),
      ]);
      sendOKResponse(res, review);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }
);
export { reviewsRouter };
