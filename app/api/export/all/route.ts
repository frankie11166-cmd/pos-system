import { getSession } from "@/lib/auth";
import { jsonError } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Please log in.", 401);
  if (session.role !== "OWNER") return jsonError("Only the owner can export all data.", 403);

  const [inventory, sales, returns, users, activityHistory] = await Promise.all([
    prisma.productVariant.findMany({
      orderBy: [{ productId: "asc" }, { productName: "asc" }, { size: "asc" }, { color: "asc" }],
    }),
    prisma.sale.findMany({
      include: { items: true },
      orderBy: { saleTimestamp: "desc" },
    }),
    prisma.returnRecord.findMany({
      orderBy: { returnTimestamp: "desc" },
    }),
    prisma.userAccount.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.activityHistory.findMany({
      include: {
        userAccount: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    }),
  ]);

  const date = new Date().toISOString().slice(0, 10);
  return new Response(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        inventory,
        sales,
        returns,
        users,
        activityHistory,
      },
      null,
      2,
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="pos-backup-${date}.json"`,
      },
    },
  );
}
