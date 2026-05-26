CREATE TYPE "ActivityType" AS ENUM ('STOCK_ADDED', 'SALE', 'RETURN');

CREATE TABLE "ProductVariant" (
  "id" SERIAL NOT NULL,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "barcode" TEXT,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "sellingPrice" DOUBLE PRECISION NOT NULL,
  "costPrice" DOUBLE PRECISION,
  "arrivalDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductVariant_productId_productName_size_color_key"
ON "ProductVariant"("productId", "productName", "size", "color");

CREATE TABLE "Sale" (
  "id" SERIAL NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "saleTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Sale_receiptNumber_key"
ON "Sale"("receiptNumber");

CREATE TABLE "SaleItem" (
  "id" SERIAL NOT NULL,
  "saleId" INTEGER NOT NULL,
  "productVariantId" INTEGER NOT NULL,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quantitySold" INTEGER NOT NULL,
  "sellingPrice" DOUBLE PRECISION NOT NULL,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "finalAmount" DOUBLE PRECISION NOT NULL,

  CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReturnRecord" (
  "id" SERIAL NOT NULL,
  "receiptNumber" TEXT,
  "productVariantId" INTEGER NOT NULL,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quantityReturned" INTEGER NOT NULL,
  "reason" TEXT,
  "returnTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReturnRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityHistory" (
  "id" SERIAL NOT NULL,
  "actionType" "ActivityType" NOT NULL,
  "productVariantId" INTEGER,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quantityChanged" INTEGER NOT NULL,
  "note" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ActivityHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SaleItem"
ADD CONSTRAINT "SaleItem_saleId_fkey"
FOREIGN KEY ("saleId") REFERENCES "Sale"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaleItem"
ADD CONSTRAINT "SaleItem_productVariantId_fkey"
FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReturnRecord"
ADD CONSTRAINT "ReturnRecord_productVariantId_fkey"
FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActivityHistory"
ADD CONSTRAINT "ActivityHistory_productVariantId_fkey"
FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
