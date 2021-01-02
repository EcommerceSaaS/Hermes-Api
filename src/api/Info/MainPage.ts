import { Router, Request, Response } from "express";
import {
  sendErrorResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import { adminModel } from "../admin/AdminModel";
import { ProductModel } from "../product/ProductsModel";
import { User } from "../users/UserModel";
const mainPageRouter = Router();
mainPageRouter.get("/mainPageInfo", async (req: Request, res: Response) => {
  try {
    const [
      banners,
      newestDesigns,
      popularDesigns,
      popularArtists,
    ] = await Promise.all([
      adminModel.findOne({ default: true }).select("bannerImages"),
      ProductModel.find().sort({ createdAt: -1 }).limit(8),
      ProductModel.find().sort({ numberOfOrders: -1 }).limit(8),
      User.aggregate([
        {
          $lookup: {
            from: "designs",
            localField: "designs",
            foreignField: "_id",
            as: "designs",
          },
        },
        {
          $unwind: "$designs",
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            storeName: { $first: "$storeName" },
            profileBanner: { $first: "$profileBanner" },
            profilePhoto: { $first: "$profilePhoto" },
            totalNbOrders: { $sum: "$designs.numberOfOrders" },
          },
        },
        { $limit: 8 },
      ]),
    ]);
    sendOKResponse(res, {
      banners,
      newestDesigns,
      popularDesigns,
      popularArtists,
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
export { mainPageRouter };
