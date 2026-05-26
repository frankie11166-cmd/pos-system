import { ActivityType, type Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { jsonError, parseNumber, parsePositiveInt } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  if (query) {
    const sales = await prisma.sale.findMany({
      where: {
        OR: [
          { receiptNumber: { contains: query } },
          { items: { some: { productId: { contains: query } } } },
          { items: { some: { productName: { contains: query } } } },
        ],
      },
      include: { items: true },
      orderBy: { saleTimestamp: "desc" },
      take: 30,
    });

    return Response.json(sales);
  }

  const receipt = cleanReceipt(url.searchParams.get("receipt"));
  if (receipt) {
    const sale = await prisma.sale.findFirst({
      where: { receiptNumber: { equals: receipt } },
      include: { items: true },
    });
    return Response.json(sale);
  }

  const productId = url.searchParams.get("productId")?.trim();
  if (productId) {
    const sales = await prisma.sale.findMany({
      where: {
        items: {
          some: {
            productId: { contains: productId },
          },
        },
      },
      include: { items: true },
      orderBy: { saleTimestamp: "desc" },
      take: 100,
    });

    return Response.json(sales);
  }

  const date = url.searchParams.get("date")?.trim();
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);

    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      return jsonError("Date is invalid.");
    }

    const sales = await prisma.sale.findMany({
      where: { saleTimestamp: { gte: start, lte: end } },
      include: { items: true },
      orderBy: { saleTimestamp: "desc" },
    });

    return Response.json(sales);
  }

  const sales = await prisma.sale.findMany({
    include: { items: true },
    orderBy: { saleTimestamp: "desc" },
    take: 100,
  });

  return Response.json(sales);
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Please log in before saving a sale.", 401);

    const body = await request.json();
    const productVariantId = parsePositiveInt(body.productVariantId, "Product");
    const quantitySold = parsePositiveInt(body.quantitySold, "Quantity sold");
    const discountAmount = body.discountAmount === "" || body.discountAmount == null ? 0 : parseNumber(body.discountAmount, "Discount");
    const approvalPrice = body.approvalPrice === "" || body.approvalPrice == null ? null : parseNumber(body.approvalPrice, "Approval price");
    const paymentMethod = parsePaymentMethod(body.paymentMethod);

    if (discountAmount < 0) return jsonError("Discount cannot be negative.");
    if (approvalPrice != null && approvalPrice < 0) return jsonError("Approval price cannot be negative.");
    if (session.role === "STAFF" && discountAmount > 50) {
      return jsonError("Staff discount amount cannot be above 50.", 403);
    }

    const sale = await prisma.$transaction(async (tx) => {
      const product = await tx.productVariant.findUnique({ where: { id: productVariantId } });
      if (!product) throw new Error("Product was not found.");
      if (product.quantity < quantitySold) throw new Error("Not enough stock available.");

      const unitPrice = approvalPrice ?? product.sellingPrice;
      const subtotal = unitPrice * quantitySold;
      const finalAmount = Math.max(subtotal - discountAmount, 0);
      const receipt = await nextReceiptNumber(tx);

      const createdSale = await tx.sale.create({
        data: {
          receiptNumber: receipt,
          totalAmount: finalAmount,
          discountAmount,
          paymentMethod,
          items: {
            create: {
              productVariantId: product.id,
              productId: product.productId,
              productName: product.productName,
              size: product.size,
              color: product.color,
              quantitySold,
              sellingPrice: unitPrice,
              discountAmount,
              finalAmount,
            },
          },
        },
        include: { items: true },
      });

      await tx.productVariant.update({
        where: { id: product.id },
        data: { quantity: { decrement: quantitySold } },
      });

      await tx.activityHistory.create({
        data: {
          actionType: ActivityType.SALE,
          productVariantId: product.id,
          productId: product.productId,
          productName: product.productName,
          size: product.size,
          color: product.color,
          userAccountId: session.id,
          quantityChanged: -quantitySold,
          note: `Receipt ${receipt} - ${paymentMethod} - Sold by ${session.name}`,
        },
      });

      return createdSale;
    });

    return Response.json(sale);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to save sale.");
  }
}

function cleanReceipt(value: string | null) {
  if (!value) return "";
  return value.trim().replace(/[.\s]+$/g, "");
}

async function nextReceiptNumber(tx: Prisma.TransactionClient) {
  const now = new Date();
  const prefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const latest = await tx.sale.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: "desc" },
  });
  const latestSequence = latest ? Number(latest.receiptNumber.slice(prefix.length)) : 0;
  const nextSequence = Number.isFinite(latestSequence) ? latestSequence + 1 : 1;
  return `${prefix}${String(nextSequence).padStart(3, "0")}`;
}

function parsePaymentMethod(value: unknown) {
  const method = String(value || "Cash").trim();
  const allowed = ["Cash", "Card", "WeChat/Alipay"];
  if (!allowed.includes(method)) {
    throw new Error("Payment method is invalid.");
  }
  return method;
}
