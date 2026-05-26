import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.productVariant.findMany({
    orderBy: [{ productId: "asc" }, { size: "asc" }, { color: "asc" }],
  });

  return Response.json(items);
}
