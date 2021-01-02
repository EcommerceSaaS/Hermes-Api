import { productTypeModel } from "../product-type/ProductTypeModel";

async function getPrice(productTypesRefs: string[]): Promise<number> {
  const productTypes = await productTypeModel.find({
    _id: { $in: productTypesRefs },
  });
  let price = 0;
  productTypes.forEach((item) => {
    price += item.price;
  });
  return price;
}
export { getPrice };
