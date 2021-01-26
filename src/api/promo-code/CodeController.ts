import { Request } from "express";
import { pick } from "lodash";
import { DocumentQuery } from "mongoose";
import { validateCode, CodeModel } from "./CodeModel";
import { ICode } from "./ICode";
//type true ==> promoCode false ==> reduction
function creatCode(req: Request, promoCode: boolean): Promise<ICode> {
  return new Promise(async (res, rej) => {
    const body: ICode = pick(req.body, [
      "name",
      "code",
      "type",
      "kind",
      "amount",
      "activationDate",
      "expirationDate",
      "active",
      "category",
      "product",
    ]) as ICode;
    if (body.code) {
      const exists = await CodeModel.exists({ code: body.code });
      if (exists) return rej(new Error("This code already exists !"));
    }
    const { error } = validateCode(body, promoCode);
    if (error) return rej(error);
    try {
      body.kind = promoCode ? "promoCode" : "reduction";
      let code = new CodeModel(body);
      code = await code.save();
      res(code);
    } catch (error) {
      rej(error);
    }
  });
}
function getAllCodes(req: Request, type: boolean): Promise<[ICode[], number]> {
  const { active } = req.query;
  const kind = type ? "PROMOCODE" : "REDUCTION";
  const filteringObject = active
    ? { active: JSON.parse(active), kind: kind }
    : { kind: kind };
  return Promise.all([
    CodeModel.find(filteringObject)
      .populate("category", "_id name")
      .populate("product", "_id name"),
    CodeModel.countDocuments(filteringObject),
  ]);
}
function deleteCode(code: string): DocumentQuery<ICode, ICode, unknown> {
  return CodeModel.findByIdAndDelete(code);
}
function updateCode(req: Request): DocumentQuery<ICode, ICode, unknown> {
  const body = pick(req.body, [
    "name",
    "code",
    "type",
    "amount",
    "activationDate",
    "expirationDate",
    "active",
    "category",
    "product",
  ]);
  const updateQuery: any = {
    $set: body,
    $unset: {},
  };

  if (!body.category) {
    delete body["category"];
    updateQuery.$unset.category = 1;
  }
  if (!body.product) {
    delete body["product"];
    updateQuery.$unset.product = 1;
  }

  return CodeModel.findByIdAndUpdate(req.params.codeId, updateQuery, {
    new: true,
  });
}
export { creatCode, deleteCode, updateCode, getAllCodes };
