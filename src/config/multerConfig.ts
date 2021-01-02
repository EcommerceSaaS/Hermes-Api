import { multerInstance } from "../config/DataBaseConnection";

export function getMulterFields() {
  return multerInstance.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "profileBanner", maxCount: 1 },
  ]);
}
export function getMulterDesignFields() {
  return multerInstance.fields([
    { name: "designPhotos", maxCount: 8 },
    { name: "productTypePhotos" },
  ]);
}
export function getMulterArray(numberOfImages: number) {
  return multerInstance.array("photos", numberOfImages);
}
export function getMulterSingle() {
  return multerInstance.single("picture");
}
export function getMulterNone() {
  return multerInstance.none();
}
