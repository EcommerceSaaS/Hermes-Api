import { Router, Request, Response } from "express";
import { pick } from "lodash";
import { validateCollection } from "./CollectionModel";
import mongoose from "mongoose";
import {
  sendBadRequestResponse,
  sendCreatedResponse,
  sendErrorResponse,
  sendOKResponse,
} from "../../services/http/Responses";
import { Collection } from "./CollectionModel";
import { getMulterSingle } from "../../config/multerConfig";
import { MulterError } from "multer";
import { removeFiles } from "../../utils/utils";
import { getGFS } from "../../config/DataBaseConnection";
import { ICollection } from "./ICollection";

const collectionsRouter = Router();
const multer = getMulterSingle();
collectionsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const filter = req.query.active
      ? { active: JSON.parse(req.query.active) }
      : {};

    const result = await Promise.all([
      Collection.find(filter),
      Collection.countDocuments(filter),
    ]);
    sendOKResponse(res, { collections: result[0], count: result[1] });
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
collectionsRouter.get("/:collectionId", async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.collectionId))
      return sendBadRequestResponse(res, "Not a valid object Id");
    const collection = await Collection.findById(req.params.collectionId);
    if (!collection)
      return sendBadRequestResponse(res, "collection id does not exist");
    sendOKResponse(res, collection);
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
collectionsRouter.post("/", async (req: Request, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) {
      return sendErrorResponse(res, err);
    }
    const file = req.file;
    // if (!file) {
    //   return sendBadRequestResponse(res, "At least one image is required");
    // }
    const body: ICollection = pick(req.body, ["name"]) as ICollection;
    const { error } = validateCollection(body);
    if (error) return sendBadRequestResponse(res, error.details[0].message);
    try {
      body.collectionImage = file?.filename;
      let collection = new Collection(body);
      collection = await collection.save();
      sendCreatedResponse(res, collection);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });
});
collectionsRouter.delete(
  "/:collectionId",
  async (req: Request, res: Response) => {
    try {
      if (!mongoose.isValidObjectId(req.params.collectionId))
        return sendBadRequestResponse(res, "Not a valid object Id");
      const collection = await Collection.findByIdAndDelete(
        req.params.collectionId
      );
      if (!collection)
        return sendBadRequestResponse(res, "collection id does not exist");
      sendOKResponse(res, collection);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }
);
collectionsRouter.put("/:collectionId", async (req: Request, res: Response) => {
  multer(req, res, async (err: MulterError) => {
    if (err) return sendErrorResponse(res, err);
    const gfs = getGFS();
    try {
      const { collectionId } = req.params;
      if (!mongoose.isValidObjectId(collectionId))
        return sendBadRequestResponse(res, "Not a valid object Id");
      const file = req.file;
      const body: ICollection = pick(req.body, [
        "name",
        "active",
      ]) as ICollection;
      body.collectionImage = file.filename;
      let collection = await Collection.findById(collectionId);
      removeFiles(gfs, [collection.collectionImage]);
      collection = await Collection.findByIdAndUpdate(collectionId, body, {
        new: true,
      });
      if (!collection)
        return sendBadRequestResponse(res, "collection id does not exist");
      sendOKResponse(res, collection);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });
});

export { collectionsRouter };
