import { ActivityType } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { jsonError, parseNumber, parsePositiveInt } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Please log in before adding stock.", 401);

    const body = await request.json();
    const productId = String(body.productId || "").trim();
    const productName = String(body.productName || "").trim();
    const color = String(body.color || "").trim();
    const barcode = body.barcode ? String(body.barcode).trim() : null;
    const sellingPrice = parseNumber(body.sellingPrice, "Selling price");
    const costPrice = body.costPrice === "" || body.costPrice == null ? null : parseNumber(body.costPrice, "Cost price");
    const arrivalDate = new Date(body.arrivalDate);
    const stockItems = parseStockItems(body);

    if (!productId || !productName || !color) {
      return jsonError("Product ID, product name, and color are required.");
    }

    if (!Number.isFinite(arrivalDate.getTime())) {
      return jsonError("Arrival date is required.");
    }
    if (stockItems.length === 0) {
      return jsonError("Enter quantity for at least one size.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const products = [];

      for (const item of stockItems) {
        const existing = await tx.productVariant.findUnique({
          where: { productId_productName_size_color: { productId, productName, size: item.size, color } },
        });

        const product = existing
          ? await tx.productVariant.update({
              where: { id: existing.id },
              data: {
                barcode,
                productName,
                quantity: { increment: item.quantity },
                sellingPrice,
                costPrice,
                arrivalDate,
              },
            })
          : await tx.productVariant.create({
              data: {
                productId,
                productName,
                barcode,
                size: item.size,
                color,
                quantity: item.quantity,
                sellingPrice,
                costPrice,
                arrivalDate,
              },
            });

        await tx.activityHistory.create({
          data: {
            actionType: ActivityType.STOCK_ADDED,
            productVariantId: product.id,
            productId,
            productName,
            size: item.size,
            color,
            userAccountId: session.id,
            quantityChanged: item.quantity,
            note: `${existing ? "Added to existing stock" : "Created new stock"} - Added by ${session.name}`,
          },
        });

        products.push(product);
      }

      return products;
    });

    return Response.json({
      productId,
      productName,
      color,
      totalQuantity: stockItems.reduce((total, item) => total + item.quantity, 0),
      items: result,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to add stock.");
  }
}

function parseStockItems(body: Record<string, unknown>) {
  if (Array.isArray(body.items)) {
    return body.items
      .map((item) => {
        const value = item as Record<string, unknown>;
        return {
          size: String(value.size || "").trim(),
          quantity: Number(value.quantity || 0),
        };
      })
      .filter((item) => item.size && Number.isInteger(item.quantity) && item.quantity > 0);
  }

  const size = String(body.size || "").trim();
  const quantity = parsePositiveInt(body.quantity, "Quantity");
  return [{ size, quantity }];
}
