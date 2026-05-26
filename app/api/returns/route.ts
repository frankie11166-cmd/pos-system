import { ActivityType } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { jsonError, parsePositiveInt } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const returns = await prisma.returnRecord.findMany({
    orderBy: { returnTimestamp: "desc" },
    take: 100,
  });

  return Response.json(returns);
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Please log in before saving a return.", 401);

    const body = await request.json();
    const productVariantId = parsePositiveInt(body.productVariantId, "Product");
    const quantityReturned = parsePositiveInt(body.quantityReturned, "Quantity returned");
    const receiptNumber = body.receiptNumber ? String(body.receiptNumber).trim().replace(/[.\s]+$/g, "") : null;
    const reason = body.reason ? String(body.reason).trim() : null;

    if (!receiptNumber) {
      return jsonError("A return must be linked to a sale receipt.");
    }
    if (session.role === "STAFF" && !reason) {
      return jsonError("Staff must enter a return reason.", 403);
    }

    const record = await prisma.$transaction(async (tx) => {
      const product = await tx.productVariant.findUnique({ where: { id: productVariantId } });
      if (!product) throw new Error("Product was not found.");

      const sale = await tx.sale.findUnique({
        where: { receiptNumber },
        include: { items: true },
      });
      if (!sale) throw new Error("Sale receipt was not found.");

      const saleItem = sale.items.find((item) => item.productVariantId === productVariantId);
      if (!saleItem) throw new Error("This product was not sold on the selected receipt.");

      const previousReturns = await tx.returnRecord.aggregate({
        _sum: { quantityReturned: true },
        where: { receiptNumber, productVariantId },
      });
      const alreadyReturned = previousReturns._sum.quantityReturned || 0;
      const remainingReturnable = saleItem.quantitySold - alreadyReturned;
      if (quantityReturned > remainingReturnable) {
        throw new Error(`Only ${remainingReturnable} item(s) from this sale can still be returned.`);
      }

      const returnRecord = await tx.returnRecord.create({
        data: {
          receiptNumber,
          productVariantId: product.id,
          productId: product.productId,
          productName: product.productName,
          size: product.size,
          color: product.color,
          quantityReturned,
          reason,
        },
      });

      await tx.productVariant.update({
        where: { id: product.id },
        data: { quantity: { increment: quantityReturned } },
      });

      await tx.activityHistory.create({
        data: {
          actionType: ActivityType.RETURN,
          productVariantId: product.id,
          productId: product.productId,
          productName: product.productName,
          size: product.size,
          color: product.color,
          userAccountId: session.id,
          quantityChanged: quantityReturned,
          note: [receiptNumber ? `Receipt ${receiptNumber}` : null, reason, `Returned by ${session.name}`].filter(Boolean).join(" - "),
        },
      });

      return returnRecord;
    });

    return Response.json(record);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to save return.");
  }
}
