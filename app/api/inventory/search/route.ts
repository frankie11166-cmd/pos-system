import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const scope = searchParams.get("scope")?.trim();

  if (!query) {
    return Response.json([]);
  }

  const items = await prisma.productVariant.findMany({
    where: {
      OR:
        scope === "product"
          ? [{ productId: { contains: query } }, { productName: { contains: query } }, { barcode: { contains: query } }]
          : [
              { productId: { contains: query } },
              { productName: { contains: query } },
              { barcode: { contains: query } },
              { size: { contains: query } },
              { color: { contains: query } },
            ],
    },
    orderBy: [{ productId: "asc" }, { size: "asc" }],
    take: 25,
  });

  return Response.json(items);
}
