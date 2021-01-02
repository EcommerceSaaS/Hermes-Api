import { Request, Response, Router } from "express";
import { MulterError } from "multer";
import {
  getMulterDesignFields,
  getMulterSingle,
} from "../../config/multerConfig";
import mongoose from "mongoose";
import {
  sendErrorResponse,
  sendBadRequestResponse,
  sendCreatedResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import {
  extractFilesFromRequestDesign,
  removeFiles,
  validateDesignProductType,
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
import { MattersModel } from "../matters/MatterModel";
import { getPrice } from "./utils";
import { reviewsRouter } from "../reviews/ReviewRouter";
import IMatter from "../matters/IMatter";

const multer = getMulterDesignFields();
const singleFileMulter = getMulterSingle();
const designsRouter = Router({ mergeParams: true });
designsRouter.use("/:designId/reviews", reviewsRouter);
designsRouter.post("/", [Auth, Artist], async (req: any, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) return sendErrorResponse(res, err);
    const files: any = extractFilesFromRequestDesign(req);
    if (!files.designPhotos || !files.productTypePhotos)
      return sendBadRequestResponse(
        res,
        "Each product has to have images and each productType too"
      );
    files.designPhotos.forEach((item: { filename: string }, index: number) => {
      files.designPhotos[index] = item.filename;
    });
    files.productTypePhotos.forEach(
      (item: { filename: string }, index: number) => {
        files.productTypePhotos[index] = item.filename;
      }
    );
    files.allFiles = [...files.productTypePhotos, ...files.designPhotos];
    try {
      let artist = await User.findById({ _id: req.user.id });
      const design = await createDesign(req, files, artist._id);
      artist = await artist.update({ $push: { designs: design._id } });
      //promise all
      sendCreatedResponse(res, design);
    } catch (error) {
      if (err instanceof Error) return sendErrorResponse(res, error);
      sendBadRequestResponse(res, error);
    }
  });
});
designsRouter.get("/", async (req: Request, res: Response) => {
  try {
    let {
      limit,
      page,
      sort,
      sortByPrice,
      q,
      collections,
      categories,
      colors,
      productTypes,
      minPrice,
      maxPrice,
    } = req.query;
    collections = collections ? collections : [];
    categories = categories ? categories : [];
    colors = colors ? colors : [];
    productTypes = productTypes ? productTypes : [];
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
      categories,
      colors,
      productTypes
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
designsRouter.get(
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
designsRouter.get("/:designId", async (req: Request, res: Response) => {
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
designsRouter.put("/productType/:designId", (req: Request, res: Response) => {
  singleFileMulter(req, res, async (err: MulterError) => {
    if (err) return sendErrorResponse(res, err);
    try {
      const { designId } = req.params;
      if (!mongoose.isValidObjectId(designId) || !req.file)
        return sendBadRequestResponse(
          res,
          "Either designId is not valid or an image was not uploaded"
        );
      const body: {
        productTypeRef: string;
        matter: string | IMatter;
        colors: string;
        productTypePhoto?: string;
      } = pick(req.body, ["productTypeRef", "matter", "colors"]);
      const { error } = validateDesignProductType(body);
      if (error) return sendBadRequestResponse(res, error.details[0].message);
      body.productTypePhoto = req.file.filename;
      const newPriceProductType = [body.productTypeRef];
      let design = await ProductModel.findById({ _id: designId });
      design.productTypes.forEach((productType) =>
        newPriceProductType.push(productType.productTypeRef)
      );
      const newPrice = await getPrice(newPriceProductType);
      design = await design.update({
        totalPrice: newPrice,
        $push: { productTypes: body },
      });
      body["matter"] = await MattersModel.findById({ _id: body.matter }).select(
        "name _id"
      );
      sendOKResponse(res, { newProductType: body });
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });
});
designsRouter.put(
  "/:designId/:productTypeRef",
  (req: Request, res: Response) => {
    singleFileMulter(req, res, async () => {
      const { designId, productTypeRef } = req.params;
      if (
        !mongoose.isValidObjectId(designId) ||
        !mongoose.isValidObjectId(productTypeRef)
      )
        return sendBadRequestResponse(
          res,
          "Either one of two params is missing "
        );
      //pre validation
      let design = await ProductModel.findById({
        _id: designId,
        "productTypes.productTypeRef": productTypeRef,
      });
      let indexToUpdate = -1;
      try {
        design.productTypes.forEach((productType, index) => {
          if (String(productType.productTypeRef) === String(productTypeRef)) {
            const { colors, matter } = req.body;
            const image = req.file;
            const newProductType = {
              colors,
              matter,
              productTypePhoto: image ? image.filename : undefined,
            };
            indexToUpdate = index;
            const oldImageId = productType.productTypePhoto;
            productType = merge(productType, newProductType);
            productType.colors = [
              ...new Set<string>(
                newProductType.colors.map((item: any) => item.toString())
              ),
            ];
            const gfs = getGFS();
            if (image != undefined && image.filename != undefined)
              removeFiles(gfs, [oldImageId]);
          }
        });
        await design.save();
        design = await design
          .populate({
            path: "productTypes.matter",
            select: "_id name",
          })
          .execPopulate();
        sendOKResponse(res, {
          newProductType: design.productTypes[indexToUpdate],
        });
      } catch (error) {
        sendErrorResponse(res, error);
      }
    });
  }
);

designsRouter.put("/:designId", (req: any, res: Response) => {
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
designsRouter.delete(
  "/:designId/:productTypeRef",
  async (req: Request, res: Response) => {
    const { designId, productTypeRef } = req.params;
    if (
      !mongoose.isValidObjectId(designId) ||
      !mongoose.isValidObjectId(productTypeRef)
    )
      return sendBadRequestResponse(
        res,
        "Either one of two params is missing "
      );
    try {
      const gfs = getGFS();
      const design = await ProductModel.findById(designId);
      let imageToDelete = null;
      const productTypes = design.productTypes
        .map((item) => {
          if (item.productTypeRef == productTypeRef)
            imageToDelete = item.productTypePhoto;
          return item.productTypeRef;
        })
        .filter((item) => productTypeRef !== item);
      removeFiles(gfs, [imageToDelete]);
      const newPrice = await getPrice(productTypes);
      await design.update({
        totalPrice: newPrice,
        $pull: { productTypes: { productTypeRef } },
      });
      sendOKResponse(res, design);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }
);
designsRouter.delete(
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
      design.productTypes.forEach((item) => files.push(item.productTypePhoto));
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

export { designsRouter };
