import { LOW_STOCK_DEFAULT, oldStockCutoff } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lowStockThreshold = Number(searchParams.get("threshold") || LOW_STOCK_DEFAULT);

  const [lowStock, oldStock] = await Promise.all([
    prisma.productVariant.findMany({
      where: { quantity: { lte: lowStockThreshold } },
      orderBy: [{ quantity: "asc" }, { productId: "asc" }],
    }),
    prisma.productVariant.findMany({
      where: { arrivalDate: { lt: oldStockCutoff() } },
      orderBy: { arrivalDate: "asc" },
    }),
  ]);

  return Response.json({ lowStock, oldStock, lowStockThreshold });
}
