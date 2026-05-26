PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "barcode" TEXT,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "sellingPrice" REAL NOT NULL,
  "costPrice" REAL,
  "arrivalDate" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_productId_productName_size_color_key"
ON "ProductVariant"("productId", "productName", "size", "color");

CREATE TABLE IF NOT EXISTS "Sale" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "receiptNumber" TEXT NOT NULL,
  "totalAmount" REAL NOT NULL,
  "discountAmount" REAL NOT NULL DEFAULT 0,
  "saleTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Sale_receiptNumber_key"
ON "Sale"("receiptNumber");

CREATE TABLE IF NOT EXISTS "SaleItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "saleId" INTEGER NOT NULL,
  "productVariantId" INTEGER NOT NULL,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quantitySold" INTEGER NOT NULL,
  "sellingPrice" REAL NOT NULL,
  "discountAmount" REAL NOT NULL DEFAULT 0,
  "finalAmount" REAL NOT NULL,
  CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SaleItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReturnRecord" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "receiptNumber" TEXT,
  "productVariantId" INTEGER NOT NULL,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quantityReturned" INTEGER NOT NULL,
  "reason" TEXT,
  "returnTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReturnRecord_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ActivityHistory" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "actionType" TEXT NOT NULL,
  "productVariantId" INTEGER,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quantityChanged" INTEGER NOT NULL,
  "note" TEXT,
  "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityHistory_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
