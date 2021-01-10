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
import { extractFilesFromRequestArray, routesFactory } from "../../utils/utils";
import {
  createProduct,
  getAllProducts,
  getProductbyId,
  detailsLevel,
} from "./ProductController";
import { ProductModel } from "./ProductsModel";
import { IProduct } from "./IProduct";
import { getGFS } from "../../config/DataBaseConnection";
import { User } from "../users/UserModel";
import { pick, merge, uniqWith, isEqual } from "lodash";
import { reviewsRouter } from "../reviews/ReviewRouter";
import { OptionsModel, validateOption } from "../option/OptionsModel";
import { IOption } from "../option/IOption";

const multer = getMulterArray(8);
const productsRouter = Router({ mergeParams: true });
productsRouter.use("/:productId/reviews", reviewsRouter);
productsRouter.post("/", [], async (req: any, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) return sendErrorResponse(res, err);
    const files = extractFilesFromRequestArray(req);
    if (!files.length)
      return sendBadRequestResponse(res, "Each product has to have images");
    try {
      const product = await createProduct(req, files);
      sendCreatedResponse(res, product);
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
      const products = await ProductModel.find(filter)
        .populate(detailsLevel)
        .limit(limit)
        .skip(limit * (page - 1));
      return sendOKResponse(res, products);
    }
    const [products, count] = await getAllProducts(
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
      products,
      count: count,
      nbPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.log(error);
    sendErrorResponse(res, error);
  }
});
productsRouter.get("/:productId", async (req: Request, res: Response) => {
  const { productId } = req.params;
  //userID for design of a certain user
  if (!productId || !mongoose.isValidObjectId(productId))
    return sendBadRequestResponse(res, "product id not valid");

  try {
    const product = await getProductbyId(productId);
    sendOKResponse(res, product);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
productsRouter.put("/:productId", (req: Request, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) return sendErrorResponse(res, err);
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId))
      return sendBadRequestResponse(res, "product id not valid");
    //just checking for
    const body: any = pick(req.body, [
      "name",
      "description",
      "categories",
      "collections",
      "state",
      "productPhotostoDelete",
      "basePrice",
    ]);
    const files = extractFilesFromRequestArray(req);
    if (files.length) {
      files.forEach((filename: string, index: number) => {
        files[index] = filename;
      });
      body.productPhotos = files;
    }
    try {
      const gfs = getGFS();
      let product = await ProductModel.findById(productId);
      if (product) {
        let filesToDelete: string[] = [];
        if (body.productPhotostoDelete) {
          filesToDelete = [...body.productPhotostoDelete];
          product.productPhotos = product.productPhotos.filter((item) => {
            return !body.productPhotostoDelete.includes(item);
          });
        }
        body.productPhotos = [...files, ...product.productPhotos];
        product = merge(product, body);
        const newProduct = await ProductModel.findByIdAndUpdate(
          product._id,
          product,
          { new: true }
        );
        filesToDelete.forEach((item: string) => {
          gfs.remove({ filename: item, root: "uploads" }, (err) =>
            console.log(err)
          );
        });
        sendOKResponse(res, newProduct);
      } else sendBadRequestResponse(res, "There's no product with such Id");
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });
});
productsRouter.put(
  "/:productId/options",
  async (req: Request, res: Response) => {
    const { productId } = req.params;
    const session = mongoose.startSession();
    try {
      (await session).withTransaction(async () => {
        const body: IOption = pick(req.body, ["name", "values"]) as IOption;
        const { error } = validateOption(body);
        if (error) sendBadRequestResponse(res, error.details[0].message);
        let option = new OptionsModel(body);
        option = await option.save();
        const product = await ProductModel.findByIdAndUpdate(
          { _id: productId },
          { $push: { options: option._id } },
          { new: true }
        );
        sendOKResponse(res, product);
      });
    } catch (error) {
      sendErrorResponse(res, error);
    } finally {
      (await session).endSession();
    }
  }
);

productsRouter.delete(
  "/:productId",
  [],
  async (req: Request, res: Response) => {
    const { productId } = req.params;
    if (!productId || !mongoose.isValidObjectId(productId))
      return sendBadRequestResponse(res, "product id not valid");
    try {
      const product: IProduct = await ProductModel.findByIdAndDelete(productId);
      if (!product)
        return sendBadRequestResponse(
          res,
          "product with this id does not exist"
        );
      const gfs = getGFS();
      const files = product.productPhotos;
      files.forEach((file) => {
        gfs.remove({ filename: file, root: "uploads" }, () => console.log);
      });
      sendOKResponse(res, product);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }
);

productsRouter.delete(
  "/:productId/:optionId",
  async (req: Request, res: Response) => {
    const { productId, optionId } = req.params;
    const session = mongoose.startSession();
    try {
      (await session).withTransaction(async () => {
        const [product] = await Promise.all([
          ProductModel.findByIdAndUpdate(
            { _id: productId },
            { $pull: { options: optionId } },
            { new: true }
          ),
          OptionsModel.findByIdAndDelete({ _id: optionId }),
        ]);
        sendOKResponse(res, product);
      });
    } catch (error) {
      sendErrorResponse(res, error);
    } finally {
      (await session).endSession();
    }
  }
);

export { productsRouter };
