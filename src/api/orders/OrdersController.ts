import { wilayasPricing } from "../../utils/WilayaPricing";
import { IProduct } from "../product/IProduct";
import { ICode } from "../promo-code/ICode";
export async function getTotalPriceWithDiscount(
  products: IProduct[],
  codes: Array<ICode>
): Promise<IProduct[]> {
  return new Promise<IProduct[]>(async (res) => {
    const result = new Set<IProduct>();
    for (const product of products) {
      let promoCodeApplied = false;
      for (const code of codes) {
        //for each product check if code was applied
        //TODO test for if a promocode was applied
        // but we still have to apply multiple reductions
        if (promoCodeApplied && code.type === "PROMOCODE") continue;
        if (
          product._id.equals(code.product) ||
          product.categories.includes(code.category)
        ) {
          result.add(updateDesignPrice(code, product));
          if (code.kind === "PROMOCODE") promoCodeApplied = true;
        }
      }
      //if node code was applied to the design add it as it is
    }
    res([...result]);
  });
}
function updateDesignPrice(code: ICode, design: IProduct) {
  if (!design.priceAfterReduction)
    design.priceAfterReduction = design.basePrice;
  switch (code.type) {
    case "Amount":
      design.priceAfterReduction -= code.amount;
      break;
    case "Percentage":
      design.priceAfterReduction -= (code.amount * design.basePrice) / 100;
      break;
  }
  return design;
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
