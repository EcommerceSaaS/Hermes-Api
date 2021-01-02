import { Request } from "express";
import { pick } from "lodash";
import { getGFS } from "../../config/DataBaseConnection";
import { validateDesign, ProductModel } from "./ProductsModel";
import { removeFiles } from "../../utils/utils";
import { productTypeModel } from "../product-type/ProductTypeModel";
import { IProduct } from "./IProduct";
import { DocumentQuery } from "mongoose";
export async function createDesign(
  req: Request,
  files: any,
  artistId: string
): Promise<IProduct> {
  return new Promise(async (res, rej) => {
    const body: IProduct = pick(req.body, [
      "name",
      "description",
      "designPhotos",
      "categories",
      "collections",
      "productTypes",
    ]) as IProduct;
    body.artistId = artistId;
    const prodcutTypes: string[] = [];
    body.designPhotos = files.designPhotos;
    body.productTypes.map((item, index: number) => {
      item.productTypePhoto = files.productTypePhotos[index];
      prodcutTypes.push(item.productTypeRef);
    });
    const gfs = getGFS();
    try {
      const { error } = validateDesign(body);
      if (error) {
        removeFiles(gfs, files.allFiles);
        return rej(error.details[0].message);
      }
      body.totalPrice = await getPrice(prodcutTypes);
      let design = new ProductModel(body);
      const mongoValidation = design.validateSync();
      if (mongoValidation) {
        removeFiles(gfs, files.allFiles);
        return rej(mongoValidation.message);
      }
      design = await design.save();
      res(design);
    } catch (error) {
      rej(error);
    }
  });
}
async function getPrice(productTypesRefs: string[]) {
  const productTypes = await productTypeModel.find({
    _id: { $in: productTypesRefs },
  });
  let price = 0;
  productTypes.forEach((item) => {
    price += item.price;
  });
  return price;
}
export const detailsLevel: {
  path: string;
  select: string;
  match?: {
    active: boolean;
  };
  limit?: number;
  populate?: { path: string; select: string };
}[] = [
  { path: "collections", select: "_id name", match: { active: true } },
  { path: "categories", select: "_id name", match: { active: true } },
  { path: "artistId", select: "_id storeName" },
  {
    path: "productTypes.productTypeRef",
    select: "_id name price",
  },
  {
    path: "productTypes.colors",
    select: "_id name value",
    match: { active: true },
  },
  {
    path: "productTypes.matter",
    select: "_id name",
    match: { active: true },
  },
];
export async function getAllDesign(
  limit: number,
  page: number,
  sort: number,
  sortByPrice: number,
  q: string,
  state: "inactive" | "active" | "archived",
  minPrice: number,
  maxPrice: number,
  collectionsFilter: string[],
  categoriesFilter: string[],
  colorsFilter: string[],
  productTypesFilter: string[]
): Promise<[IProduct[], number]> {
  const filter: {
    name: {
      $regex: string;
      $options: string;
    };
    totalPrice: {
      $gte: number;
      $lte: number;
    };
    state?: string;
    collections?: { $in: string[] };
    categories?: { $in: string[] };
    "productTypes.colors"?: { $in: string[] };
    "productTypes.productTypeRef"?: { $in: string[] };
  } = {
    name: { $regex: q, $options: "i" },
    totalPrice: {
      $gte: minPrice,
      $lte: maxPrice,
    },
  };
  const sortParams: { totalPrice?: number; createdAt?: number } = {};
  if (sortByPrice) sortParams["totalPrice"] = sortByPrice;
  if (sort) sortParams["createdAt"] = sort;

  if (state) filter["state"] = state;
  if (collectionsFilter.length)
    filter["collections"] = { $in: collectionsFilter };
  if (categoriesFilter.length) filter["categories"] = { $in: categoriesFilter };
  if (colorsFilter.length)
    filter["productTypes.colors"] = { $in: colorsFilter };
  if (productTypesFilter.length)
    filter["productTypes.productTypeRef"] = { $in: productTypesFilter };
  return await Promise.all([
    ProductModel.find(filter)
      .populate(detailsLevel)
      .limit(limit)
      .skip(limit * (page - 1))
      .sort(sortParams),
    ProductModel.countDocuments(filter),
  ]);
}
export async function getDesignbyId(
  desginId: string
): DocumentQuery<IProduct, IProduct, unknown> {
  return await ProductModel.findById({ _id: desginId }).populate(detailsLevel);
}
export async function getDesignWithReviews(
  designId: string
): DocumentQuery<IProduct, IProduct, unknown> {
  detailsLevel.push({
    path: "reviews",
    select: "-updateAt",
    limit: 5,
    populate: {
      path: "userId",
      select: "_id name profilePhoto",
    },
  });
  const res = await ProductModel.findById({ _id: designId }).populate(
    detailsLevel
  );
  detailsLevel.pop();
  return res;
}
