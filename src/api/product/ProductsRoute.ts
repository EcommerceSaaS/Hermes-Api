import { Request, Response, Router } from "express";
import { MulterError } from "multer";
import { getMulterArray } from "../../config/multerConfig";
import mongoose from "mongoose";
import {
  sendErrorResponse,
  sendBadRequestResponse,
  sendCreatedResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import {
  extractFilesFromRequestArray,
  extractFilesFromRequestDesign,
} from "../../utils/utils";
import {
  createDesign,
  getAllDesign,
  getDesignbyId,
  detailsLevel,
  getDesignWithReviews,
} from "./ProductController";
import { ProductModel } from "./ProductsModel";
import { IProduct as IDesign } from "./IProduct";
import { getGFS } from "../../config/DataBaseConnection";
import Auth from "../../services/middlewares/Auth";
import Artist from "../../services/middlewares/Artist";
import { User } from "../users/UserModel";
import { pick, merge, uniqWith, isEqual } from "lodash";
import { reviewsRouter } from "../reviews/ReviewRouter";

const multer = getMulterArray(8);
const productsRouter = Router({ mergeParams: true });
productsRouter.use("/:designId/reviews", reviewsRouter);
productsRouter.post("/", [], async (req: any, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) return sendErrorResponse(res, err);
    const files = extractFilesFromRequestArray(req);
    if (!files.length)
      return sendBadRequestResponse(res, "Each product has to have images");
    try {
      const design = await createDesign(req, files);
      sendCreatedResponse(res, design);
    } catch (error) {
      if (err instanceof Error) return sendErrorResponse(res, error);
      sendBadRequestResponse(res, error);
    }
  });
});
productsRouter.get("/", async (req: Request, res: Response) => {
  try {
    let {
      limit,
      page,
      sort,
      sortByPrice,
      q,
      collections,
      categories,
      minPrice,
      maxPrice,
    } = req.query;
    collections = collections ? collections : [];
    categories = categories ? categories : [];
    minPrice = minPrice ? Number(minPrice) : 0;
    maxPrice = maxPrice ? Number(maxPrice) : 9999999999;
    limit = Number(limit) || 10;
    page = Number(page) || 1;
    sort = Number(sort);
    sortByPrice = Number(sortByPrice);
    q = q || "";
    const { userId, categoryId } = req.params;
    if (userId && categoryId) {
      //get All designs by userId and categoryId
      if (
        !mongoose.isValidObjectId(userId) ||
        !mongoose.isValidObjectId(categoryId)
      )
        return sendBadRequestResponse(res, "One of the Ids isn't valid");
      const user = await User.findById(userId); //TODO removed this and filter by artistId
      const designs = await ProductModel.find({
        _id: { $in: [...user.designs] },
        categories: categoryId,
      }).select("name _id");
      return sendOKResponse(res, designs);
    } else if (userId) {
      //get All categories used by a user
      if (!mongoose.isValidObjectId(userId))
        return sendBadRequestResponse(res, "Userid is not a valid objectId");
      const { categoriesOnly } = req.query;

      const user = await User.findById(userId);
      if (categoriesOnly) {
        const designs = await ProductModel.find({
          _id: { $in: [...user.designs] },
        }).select("categories");
        const result: string[] = [];
        designs.forEach((item) => {
          result.push(...item.categories);
        });
        return sendOKResponse(res, {
          categories: uniqWith(result, isEqual),
        });
      }
      const filter: {
        _id: {
          $in: string[];
        };
        name: {
          $regex: string;
          $options: string;
        };
        categories?: { $in: string[] };
      } = {
        _id: { $in: [...user.designs] },
        name: { $regex: q, $options: "i" },
      };
      if (categories.length) filter["categories"] = { $in: categories };
      const designs = await ProductModel.find(filter)
        .populate(detailsLevel)
        .limit(limit)
        .skip(limit * (page - 1));
      return sendOKResponse(res, designs);
    }
    const result = await getAllDesign(
      limit,
      page,
      sort,
      sortByPrice,
      q,
      req.query.state,
      minPrice,
      maxPrice,
      collections,
      categories
    );
    sendOKResponse(res, {
      designs: result[0],
      count: result[1],
      nbPages: Math.ceil(result[1] / limit),
    });
  } catch (error) {
    console.log(error);
    sendErrorResponse(res, error);
  }
});
productsRouter.get(
  "/designDetails/:designId",
  async (req: Request, res: Response) => {
    const { designId } = req.params;
    if (!mongoose.isValidObjectId(designId))
      return sendBadRequestResponse(res, "Not a valid design Id !");
    try {
      const design = await getDesignWithReviews(designId);
      const collections = design.collections;
      const similiarDesigns = await ProductModel.find({
        _id: { $ne: designId },
        collections: {
          $in: collections,
        },
      });
      sendOKResponse(res, { design, similiarDesigns });
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }
);
productsRouter.get("/:designId", async (req: Request, res: Response) => {
  const designId = req.params.designId;
  //userID for design of a certain user
  if (!designId || !mongoose.isValidObjectId(designId))
    return sendBadRequestResponse(res, "design id not valid");

  try {
    const design = await getDesignbyId(designId);
    sendOKResponse(res, design);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

productsRouter.put("/:designId", (req: any, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) return sendErrorResponse(res, err);
    const designId = req.params.designId;
    if (!mongoose.isValidObjectId(designId))
      return sendBadRequestResponse(res, "Design id not valid");
    //just checking for
    const body: any = pick(req.body, [
      "name",
      "description",
      "categories",
      "collections",
      "state",
      "designPhotostoDelete",
    ]);
    const files = extractFilesFromRequestDesign(req);
    if (files.designPhotos.length) {
      files.designPhotos.forEach(
        (item: { filename: string }, index: number) => {
          files.designPhotos[index] = item.filename;
        }
      );
      body.designPhotos = files.designPhotos;
    }
    if (files.productTypePhotos.length) {
      files.productTypePhotos.forEach(
        (item: { filename: string }, index: number) => {
          files.productTypePhotos[index] = item.filename;
        }
      );
    }
    try {
      const gfs = getGFS();

      let design = await ProductModel.findById(designId);
      if (design) {
        let filesToDelete: string[] = [];
        if (body.designPhotostoDelete) {
          filesToDelete = [...body.designPhotostoDelete];
          design.designPhotos = design.designPhotos.filter((item) => {
            return !body.designPhotostoDelete.includes(item);
          });
        }
        body.designPhotos = [...files.designPhotos, ...design.designPhotos];
        design = merge(design, body);
        const newDesign = await ProductModel.findByIdAndUpdate(
          design._id,
          design,
          { new: true }
        );

        filesToDelete.forEach((item: string) => {
          gfs.remove({ filename: item, root: "uploads" }, (err) =>
            console.log(err)
          );
        });
        sendOKResponse(res, newDesign);
      } else sendBadRequestResponse(res, "There's no design with such Id");
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });
});

productsRouter.delete(
  "/:designId",
  [Auth, Artist],
  async (req: any, res: Response) => {
    const designId = req.params.designId;
    if (!designId || !mongoose.isValidObjectId(designId))
      return sendBadRequestResponse(res, "design id not valid");
    try {
      const design: IDesign = await ProductModel.findByIdAndDelete(designId);
      if (!design)
        return sendBadRequestResponse(
          res,
          "Design with this id does not exist"
        );
      const gfs = getGFS();
      const files = design.designPhotos;
      files.forEach((file) => {
        gfs.remove({ filename: file, root: "uploads" }, () => console.log);
      });
      await User.findByIdAndUpdate(req.user.id, {
        $pull: {
          designs: designId,
        },
      });
      sendOKResponse(res, design);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }
);

export { productsRouter };
