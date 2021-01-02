import { wilayasPricing } from "../../utils/WilayaPricing";
import { IDesign } from "../design/IDesign";
import { ICode } from "../promo-code/ICode";
import { User } from "../users/UserModel";
export async function getTotalPriceWithDiscount(
  designs: IDesign[],
  codes: Array<ICode>
): Promise<IDesign[]> {
  return new Promise<IDesign[]>(async (res) => {
    const result = new Set<IDesign>();
    for (const design of designs) {
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
            designs: design._id,
          });
          if (user) {
            result.add(updateDesignPrice(code, design));
            if (code.kind === "PROMOCODE") promoCodeApplied = true;
          } else {
            design.priceAfterReduction = design.totalPrice;
            result.add(design);
          }
        }
      }
      //if node code was applied to the design add it as it is
    }
    res([...result]);
  });
}
function updateDesignPrice(code: ICode, design: IDesign) {
  if (!design.priceAfterReduction)
    design.priceAfterReduction = design.totalPrice;
  switch (code.type) {
    case "Amount":
      design.priceAfterReduction -= code.amount;
      break;
    case "Percentage":
      design.priceAfterReduction -= (code.amount * design.totalPrice) / 100;
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
