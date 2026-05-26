import { csvResponse, datedFilename, toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.saleItem.findMany({
    include: { sale: true, productVariant: true },
    orderBy: { sale: { saleTimestamp: "desc" } },
  });

  const csv = toCsv(
    [
      "Receipt Number",
      "Sale Timestamp",
      "Product ID",
      "Product Name",
      "Size",
      "Color",
      "Quantity Sold",
      "Selling Price",
      "Discount",
      "Payment Method",
      "Final Amount",
      "Cost Price",
      "Estimated Profit",
    ],
    items.map((item) => {
      const cost = item.productVariant.costPrice;
      const profit = cost == null ? "" : (item.sellingPrice - cost) * item.quantitySold - item.discountAmount;

      return [
        item.sale.receiptNumber,
        item.sale.saleTimestamp,
        item.productId,
        item.productName,
        item.size,
        item.color,
        item.quantitySold,
        item.sellingPrice,
        item.discountAmount,
        item.sale.paymentMethod,
        item.finalAmount,
        cost,
        profit,
      ];
    }),
  );

  return csvResponse(datedFilename("sales-report"), csv);
}
