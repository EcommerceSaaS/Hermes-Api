import mongoose from "mongoose";
import { DATABASEURL } from "./Constants";
import GridFsStorage from "multer-gridfs-storage";
import uuidv4 from "uuid/v4";
import Grid from "gridfs-stream";
import multer from "multer";
import path from "path";

let gfs: Grid.Grid;
const storage = new GridFsStorage({
  url: DATABASEURL,
  file: (req, file) => {
    return {
      bucketName: "uploads",
      filename: uuidv4() + path.extname(file.originalname),
    };
  },
});
export const multerInstance = multer({
  storage,
  fileFilter(req: any, file: any, cb: any) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
      req.fileValidationError = "Only image files are allowed!";
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});
export async function initializeDataBase(): Promise<string> {
  return new Promise((res, rej) => {
    mongoose
      .connect(DATABASEURL, {
        useNewUrlParser: true,
        useFindAndModify: false,
        // useUnifiedTopology: true
        // useCreateIndex: true
      })
      .then(() => {
        gfs = Grid(mongoose.connection.db, mongoose.mongo);
        gfs.collection("uploads");
        res("Database Connected ...");
      })
      .catch((err) => {
        console.log(`${err} could not connect to database`);
        rej(err);
      });
  });
}
export function getGFS(): Grid.Grid {
  return gfs;
}
