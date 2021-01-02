import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import Grid from "gridfs-stream";
import mime from "mime";

const publicImagesRouter = Router();
publicImagesRouter.get("/:imageId", (req: Request, res: Response) => {
  const conn = mongoose.connection;
  const gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
  const imageId = req.params.imageId;
  gfs.files.find({ filename: imageId }).toArray((err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists",
      });
    }
    const readstream = gfs.createReadStream({
      filename: imageId,
      mode: "r",
    });
    res.writeHead(200, { "Content-Type": mime.getType(imageId) });
    return readstream.pipe(res);
  });
});

export { publicImagesRouter };
