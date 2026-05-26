import { csvResponse, datedFilename, toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.productVariant.findMany({
    orderBy: [{ productId: "asc" }, { size: "asc" }, { color: "asc" }],
  });

  const csv = toCsv(
    ["Product ID", "Product Name", "Barcode", "Size", "Color", "Quantity", "Selling Price", "Cost Price", "Arrival Date"],
    items.map((item) => [
      item.productId,
      item.productName,
      item.barcode,
      item.size,
      item.color,
      item.quantity,
      item.sellingPrice,
      item.costPrice,
      item.arrivalDate,
    ]),
  );

  return csvResponse(datedFilename("inventory"), csv);
}
