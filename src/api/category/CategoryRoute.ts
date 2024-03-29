import { Router, Request, Response } from "express";
import { getMulterSingle } from "../../config/multerConfig";
import { MulterError } from "multer";
import {
  sendErrorResponse,
  sendBadRequestResponse,
  sendCreatedResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import mongoose from "mongoose";
import { pick, merge } from "lodash";
import { validateCategory, Category } from "./CategoryModel";
import { getGFS } from "../../config/DataBaseConnection";
import { productsRouter } from "../product/ProductsRoute";
import { ICategory } from "./ICategory";

const categoriesRouter = Router({ mergeParams: true });
const multer = getMulterSingle();

categoriesRouter.use("/:categoryId/products", productsRouter);
categoriesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const filter = req.query.active
      ? { active: JSON.parse(req.query.active) }
      : {};
    const [categories, count] = await Promise.all([
      await Category.find(filter),
      await Category.countDocuments(filter),
    ]);
    sendOKResponse(res, {
      categories,
      count,
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

categoriesRouter.get("/:categoryId", async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  if (!mongoose.isValidObjectId(categoryId)) {
    return sendBadRequestResponse(res, "not a valid objectId");
  }
  try {
    const category = await Category.findById(categoryId);
    sendOKResponse(res, category);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
categoriesRouter.post("/", (req: Request, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) {
      return sendErrorResponse(res, err);
    }
    const file = req.file;
    if (!file) {
      return sendBadRequestResponse(res, "At least one image is required");
    }
    const body: ICategory = pick(req.body, ["name"]) as ICategory;
    const { error } = validateCategory(body);
    if (error) {
      return sendBadRequestResponse(res, error.details[0].message);
    }

    try {
      body.pubPhoto = file.filename;
      let category = new Category(body);
      const mongoError = category.validateSync();
      if (mongoError) {
        return sendBadRequestResponse(res, mongoError.message);
      }
      category = await category.save();
      sendCreatedResponse(res, category);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });
});
categoriesRouter.delete("/:categoryId", async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  if (!mongoose.isValidObjectId(categoryId)) {
    return sendBadRequestResponse(res, "not a valid objectId");
  }
  try {
    const category = await Category.findByIdAndDelete({ _id: categoryId });
    sendOKResponse(res, category);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
categoriesRouter.put("/:categoryId", (req: Request, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) return sendErrorResponse(res, err);
    const { categoryId } = req.params;
    if (!mongoose.isValidObjectId(categoryId)) {
      return sendBadRequestResponse(res, "not a valid objectId");
    }
    try {
      const body: ICategory = pick(req.body, ["name", "active"]) as ICategory;
      const file = req.file;
      const gfs = getGFS();
      let category = await Category.findById(categoryId);
      if (category) {
        if (file) {
          body.pubPhoto = file.filename;
          gfs.remove({ filename: category.pubPhoto, root: "uploads" }, (err) =>
            console.log(err)
          );
        }
        category = merge(category, body);
        await category.save();
        sendOKResponse(res, category);
      } else {
        sendBadRequestResponse(res, "There's no such category");
      }
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });
});

export { categoriesRouter };
