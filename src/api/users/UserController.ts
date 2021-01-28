/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "./UserModel";
import { pick, merge, omit } from "lodash";
import { Request } from "express";
import Joi from "@hapi/joi";
import { getGFS } from "../../config/DataBaseConnection";
import { extractFilesFromRequestFields } from "../../utils/utils";
import { removeFiles } from "../../utils/utils";
import { IUser } from "./IUser";
import g from "gridfs-stream";
import { DocumentQuery } from "mongoose";
export async function handleUserSignUp(
  req: Request,
  params: string[],
  validator: (user: IUser) => Joi.ValidationResult
): Promise<IUser> {
  return new Promise(async (res, rej) => {
    const gfs = getGFS();
    const photosFiles = extractFilesFromRequestFields(req);
    const body: IUser = pick(req.body, params) as IUser;
    body.profilePhoto = photosFiles.profilePhotoFile.filename;
    body.profileBanner = photosFiles.profilePhotoBanner.filename;
    body.address = body.address
      ? JSON.parse(JSON.stringify(body.address))[0]
      : undefined;
    body.socialMedia = body.socialMedia
      ? JSON.parse(JSON.stringify(body.socialMedia))
      : undefined;
    try {
      await userSignUp(body, validator, gfs, photosFiles, res, rej);
    } catch (error) {
      rej(error);
    }
  });
}

async function userSignUp(
  body: IUser,
  validator: (user: IUser) => Joi.ValidationResult,
  gfs: g.Grid,
  photosFiles: { profilePhotoFile: any; profilePhotoBanner: any },
  res: (value: IUser | PromiseLike<IUser>) => void,
  rej: (reason?: any) => void
) {
  try {
    const user: any = await createUser(body, validator);
    if (user.error) {
      removeFiles(gfs, [
        photosFiles.profilePhotoFile.filename,
        photosFiles.profilePhotoBanner.filename,
      ]);
    }
    res(user);
  } catch (error) {
    removeFiles(gfs, [
      photosFiles.profilePhotoFile.filename,
      photosFiles.profilePhotoBanner.filename,
    ]);
    // database validation errors
    rej(error);
  }
}

export async function createUser(
  user: IUser,
  validator: (user: IUser) => Joi.ValidationResult
): Promise<IUser | { error: string }> {
  return new Promise(async (res, rej) => {
    const { error } = validator(user);
    if (error) return res({ error: error.details[0].message });
    try {
      const insertUser = new User(user);
      await insertUser.save();
      res(insertUser);
    } catch (error) {
      rej(error);
    }
  });
}

export async function updateUser(
  userId: string,
  newUser: any,
  photos: {
    profilePhotoFile: any;
    profilePhotoBanner: any;
  }
): Promise<IUser | any> {
  return new Promise(async (res, rej) => {
    try {
      let user = await User.findById(userId);
      if (user) {
        const gfs = getGFS();
        if (photos.profilePhotoBanner) {
          if (user.profileBanner) removeFile(gfs, user.profileBanner);
          user.profileBanner = photos.profilePhotoBanner.filename;
        }
        if (photos.profilePhotoFile) {
          if (user.profilePhoto) removeFile(gfs, user.profilePhoto);
          user.profilePhoto = photos.profilePhotoFile.filename;
        }
        newUser.adresse = newUser.adresse ? newUser.adresse[0] : undefined;
        if (newUser.socialMedia) user.socialMedia = newUser.socialMedia;
        if (newUser.phone) user.phone = newUser.phone;
        user = merge(user, newUser);
        user = await user.save();
        res(omit(user, ["password"]));
      } else res(undefined);
    } catch (error) {
      rej(error);
    }
  });
}
export function deleteUser(
  userId: string
): DocumentQuery<IUser, IUser, unknown> {
  return User.findByIdAndDelete(userId);
}
export async function getUsers(
  name: string,
  limit: number,
  page: number,
  sort: number,
  start: Date,
  end: Date,
  active: string
): Promise<[IUser[], number]> {
  const filter: {
    name?: { $regex: string; $options: string };
    active?: boolean;
    createdAt?: {
      $gte: Date;
      $lte: Date;
    };
  } = {};
  if (name) filter["name"] = { $regex: name, $options: "i" };
  if (active) filter["active"] = JSON.parse(active);
  if (start != undefined && end != undefined) {
    filter["createdAt"] = {
      $gte: start,
      $lte: end,
    };
  }
  return Promise.all([
    User.find(filter)
      .limit(limit)
      .skip(limit * (page - 1))
      .sort({ name: sort })
      .select("-password -isAdmin  -tokens -provider"),
    User.countDocuments(filter),
  ]);
}
export function getUser(userId: string): DocumentQuery<IUser, IUser, unknown> {
  return User.findById({ _id: userId }).select(
    "-password -isAdmin  -tokens -provider"
  );
}

function removeFile(gfs: g.Grid, fileName: string) {
  gfs.remove({ filename: fileName, root: "uploads" }, (err: Error) => {
    console.log({ err });
  });
}
