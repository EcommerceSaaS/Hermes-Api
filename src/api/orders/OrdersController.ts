import { wilayasPricing } from "../../utils/WilayaPricing";
import { IProduct } from "../product/IProduct";
import { ICode } from "../promo-code/ICode";
import { IOrderRequest } from "./IOrder";
const AMOUNT = "Amount";
const PERCENTAGE = "Percentage";

export async function getTotalPriceWithDiscount(
  products: IProduct[],
  codes: Array<ICode>
): Promise<IProduct[]> {
  return new Promise<IProduct[]>(async (res) => {
    const result = new Set<IProduct>();
    for (const product of products) {
      let promoCodeApplied = false;
      for (const code of codes) {
        //for each product check if promocode was applied
        //but we can apply multiple reductions
        if (promoCodeApplied && code.type === "PROMOCODE") continue;
        if (
          product._id.equals(code.product) ||
          product.categories.includes(code.category)
        ) {
          result.add(updateProductPrice(code, product));
          if (code.kind === "PROMOCODE") promoCodeApplied = true;
        } else {
          //if no code was applied to the product add it as it is
          result.add(product);
        }
      }
    }
    res([...result]);
  });
}
function updateProductPrice(code: ICode, product: IProduct) {
  if (!product.priceAfterReduction) product.priceAfterReduction = product.price;
  switch (code.type) {
    case AMOUNT: {
      product.priceAfterReduction -= code.amount;
      break;
    }
    case PERCENTAGE: {
      product.priceAfterReduction -= (code.amount * product.price) / 100;
      break;
    }
  }
  return product;
}
export function normalizeOptionsAndValues(
  products: IOrderRequest[]
): {
  [productRef: string]: {
    [optionRef: string]: string[];
  };
} {
  const productsBeforeValues: {
    [productRef: string]: {
      [optionRef: string]: string[];
    };
  } = {};
  products.forEach((product: IOrderRequest) => {
    productsBeforeValues[product.productRef] = {};
    product.options.forEach(
      (option: { optionId: string; values: string[] }) => {
        productsBeforeValues[product.productRef][option.optionId] =
          option.values;
      }
    );
  });
  return productsBeforeValues;
}

export function getShippingPriceByWilaya(wilaya: string): number {
  let price = 0;
  wilayasPricing.forEach(
    (zone: { name: string; price: number; wilayas: string[] }) => {
      const found = zone.wilayas.find(
        (wilayaItem) => wilayaItem.toLowerCase() === wilaya.toLowerCase()
      );
      if (found) price = zone.price;
    }
  );
  return price;
}
