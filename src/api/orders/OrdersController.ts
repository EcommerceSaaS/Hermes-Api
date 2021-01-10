import { wilayasPricing } from "../../utils/WilayaPricing";
import { IProduct } from "../product/IProduct";
import { ICode } from "../promo-code/ICode";
import { User } from "../users/UserModel";
export async function getTotalPriceWithDiscount(
  products: IProduct[],
  codes: Array<ICode>
): Promise<IProduct[]> {
  return new Promise<IProduct[]>(async (res) => {
    const result = new Set<IProduct>();
    for (const design of products) {
      let promoCodeApplied = false;
      for (const code of codes) {
        //for each design check if code is applied
        if (promoCodeApplied) continue;
        if (
          design._id.equals(code.design) ||
          design.categories.includes(code.category)
        ) {
          result.add(updateDesignPrice(code, design));
          if (code.kind === "PROMOCODE") promoCodeApplied = true;
        } else if (code.artist) {
          // we access database just in case no category or design id can be applied
          const user = await User.findOne({
            _id: code.artist,
            products: design._id,
          });
          if (user) {
            result.add(updateDesignPrice(code, design));
            if (code.kind === "PROMOCODE") promoCodeApplied = true;
          } else {
            design.priceAfterReduction = design.basePrice;
            result.add(design);
          }
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
