import mongoose from "mongoose";
import g from "gridfs-stream";
import Joi from "@hapi/joi";
import { Response } from "express";
import { sendErrorResponse } from "../services/http/Responses";
export function extractFilesFromRequestFields(req: any) {
  const profilePhotoFile = req.files.profilePicture
    ? req.files.profilePicture[0]
    : "";
  const profilePhotoBanner = req.files.profileBanner
    ? req.files.profileBanner[0]
    : "";

  return { profilePhotoFile, profilePhotoBanner };
}

export function extractFilesFromRequestDesign(req: any) {
  const designPhotos = req.files.designPhotos ? req.files.designPhotos : [];
  const productTypePhotos = req.files.productTypePhotos
    ? req.files.productTypePhotos
    : [];
  return { designPhotos, productTypePhotos };
}
export function extractFilesFromRequestArray(req: any) {
  const fileNames: string[] = [];
  const files = JSON.parse(JSON.stringify(req.files));
  for (let i = 0; i < files.length; i++) {
    fileNames.push(files[i].filename);
  }
  return fileNames;
}

export function extractFilesFromRequestSingle(req: any) {
  return req.file.filename;
}

export const urlPattern = new RegExp(
  "[(http(s)?)://(www.)?a-zA-Z0-9@:%.+~#=]{2,256}.[a-z]{2,6}([-a-zA-Z0-9@:%+.~#?&//=]*)",
  "i"
);
export function removeFiles(gfs: g.Grid, fileNamesArray: string[]) {
  fileNamesArray.forEach((file) => {
    if (file) {
      gfs.remove({ filename: file, root: "uploads" }, (err: any) => {
        console.log({ imageRemovalError: err });
      });
    }
  });
}
export function validator(v: any): boolean {
  return mongoose.isValidObjectId(v);
}
export function routesFactory(
  res: Response,
  route: () => void,
  fallback: (error: Error) => void = (error) => sendErrorResponse(res, error)
): void {
  try {
    route();
  } catch (error) {
    fallback(error);
  }
}
