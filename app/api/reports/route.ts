import { startOfDay, startOfMonth, startOfWeek } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const [dailySales, weeklySales, monthlySales, bestSelling, returns, saleItems] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: { saleTimestamp: { gte: startOfDay(now) } },
    }),
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: { saleTimestamp: { gte: startOfWeek(now) } },
    }),
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: { saleTimestamp: { gte: startOfMonth(now) } },
    }),
    prisma.saleItem.groupBy({
      by: ["productId", "productName", "size", "color"],
      _sum: { quantitySold: true, finalAmount: true },
      orderBy: { _sum: { quantitySold: "desc" } },
      take: 10,
    }),
    prisma.returnRecord.findMany({
      orderBy: { returnTimestamp: "desc" },
      take: 50,
    }),
    prisma.saleItem.findMany({
      include: { productVariant: true },
    }),
  ]);

  const profitEstimate = saleItems.reduce((sum, item) => {
    const cost = item.productVariant.costPrice;
    if (cost == null) return sum;
    return sum + (item.sellingPrice - cost) * item.quantitySold - item.discountAmount;
  }, 0);

  return Response.json({
    dailySales,
    weeklySales,
    monthlySales,
    bestSelling,
    profitEstimate,
    returns,
  });
}
