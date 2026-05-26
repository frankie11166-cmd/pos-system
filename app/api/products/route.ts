import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId")?.trim();

  if (!productId) return Response.json([]);

  const variants = await prisma.productVariant.findMany({
    where: { productId: { equals: productId } },
    orderBy: [{ productName: "asc" }, { updatedAt: "desc" }],
  });

  const profiles = Array.from(
    variants
      .reduce((map, item) => {
        if (!map.has(item.productName)) {
          map.set(item.productName, {
            productId: item.productId,
            productName: item.productName,
            sellingPrice: item.sellingPrice,
            costPrice: item.costPrice,
          });
        }
        return map;
      }, new Map<string, { productId: string; productName: string; sellingPrice: number; costPrice: number | null }>())
      .values(),
  );

  return Response.json(profiles);
}
