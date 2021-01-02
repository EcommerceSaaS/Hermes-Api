import { Request, Response, Router } from "express";
import { validateProductType, productTypeModel } from "./ProductTypeModel";
import { pick } from "lodash";
import {
  sendErrorResponse,
  sendOKResponse,
  sendBadRequestResponse,
  sendCreatedResponse,
} from "../../services/http/Responses";
import { Category } from "../category/CategoryModel";
import { matterRouter } from "../matters/MattersRoutes";
import { IProductType } from "./IProductType";
import { ProductTypeRessource } from "../product-type-resource/ProductTypeResourceModel";

const productTypeRouter = Router({ mergeParams: true });
productTypeRouter.use("/:productTypeId/matters", matterRouter);
productTypeRouter.get("/", async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId;
    if (categoryId) {
      const categoryProductTypes = await Category.findById({
        _id: categoryId,
      })
        .select("productTypes")
        .populate({
          path: "productTypes",
          match: { active: true },
          select: { _id: 1, name: 1, price: 1 },
        });
      sendOKResponse(res, categoryProductTypes);
    } else {
      const result = await Promise.all([
        await productTypeModel
          .find(
            req.query.active ? { active: JSON.parse(req.query.active) } : {}
          )
          .populate("colors")
          .populate("sizes")
          .populate("matters"),
        productTypeModel.countDocuments(
          req.query.active ? { active: JSON.parse(req.query.active) } : {}
        ),
      ]);
      sendOKResponse(res, { productTypes: result[0], count: result[1] });
    }
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
productTypeRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const productTypeId = req.params.id;
    const categoryId = req.params.categoryId;
    if (productTypeId !== undefined && categoryId !== undefined) {
      const category = await Category.findOne({
        _id: categoryId,
        productTypes: productTypeId,
      })
        .select("productTypes")
        .populate({
          path: "productTypes",
          match: { _id: productTypeId },
          populate: [{ path: "colors" }, { path: "sizes" }],
        });
      const productType = category ? category.productTypes[0] : {};
      return sendOKResponse(res, productType);
    } else if (productTypeId !== undefined) {
      const productType = await productTypeModel
        .findById({ _id: productTypeId })
        .populate("colors")
        .populate("sizes")
        .populate("matters");
      return sendOKResponse(res, productType);
    }
  } catch (error) {
    return sendErrorResponse(res, error);
  }
});

productTypeRouter.post("/", async (req: Request, res: Response) => {
  try {
    const body: IProductType = pick(req.body, [
      "name",
      "price",
      "colors",
      "sizes",
      "matters",
    ]) as IProductType;
    const { error } = validateProductType(body);
    if (error) return sendBadRequestResponse(res, error.details[0].message);
    let productType = new productTypeModel(body);
    const mongoError = productType.validateSync();
    if (mongoError) return sendBadRequestResponse(res, mongoError.message);
    productType = await productType.save();
    await Promise.all([
      ProductTypeRessource.insertMany([
        ...body.matters.map((matter) => {
          return {
            productTypeId: productType._id,
            matterId: matter,
          };
        }),
        ...body.sizes.map((size) => {
          return {
            productTypeId: productType._id,
            sizeId: size,
          };
        }),
        ...body.colors.map((color) => {
          return {
            productTypeId: productType._id,
            colorId: color,
          };
        }),
      ]),
    ]);
    sendCreatedResponse(res, productType);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
productTypeRouter.put("/:id", async (req: Request, res: Response) => {
  const productTypeId = req.params.id;
  const reqBody = pick(req.body, [
    "name",
    "price",
    "colors",
    "sizes",
    "active",
    "matters",
  ]);
  try {
    const newProductType = await productTypeModel.findByIdAndUpdate(
      productTypeId,
      reqBody,
      {
        new: true,
      }
    );
    if (!newProductType)
      return sendBadRequestResponse(res, "id does not exist");
    sendOKResponse(res, newProductType);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
productTypeRouter.delete("/:id", async (req: Request, res: Response) => {
  const { id: productTypeId } = req.params;
  try {
    const productType = await productTypeModel.findByIdAndDelete(productTypeId);
    if (!productType) return sendBadRequestResponse(res, "Id does not exist");
    sendOKResponse(res, productType);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

export { productTypeRouter };
