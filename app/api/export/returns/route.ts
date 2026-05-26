import { csvResponse, datedFilename, toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const returns = await prisma.returnRecord.findMany({
    orderBy: { returnTimestamp: "desc" },
  });

  const csv = toCsv(
    ["Receipt Number", "Return Timestamp", "Product ID", "Product Name", "Size", "Color", "Quantity Returned", "Reason"],
    returns.map((record) => [
      record.receiptNumber,
      record.returnTimestamp,
      record.productId,
      record.productName,
      record.size,
      record.color,
      record.quantityReturned,
      record.reason,
    ]),
  );

  return csvResponse(datedFilename("returns"), csv);
}
