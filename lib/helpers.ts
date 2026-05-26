import { ActivityType, type ProductVariant } from "@prisma/client";

export const LOW_STOCK_DEFAULT = 1;
export const OLD_STOCK_DAYS = 180;

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function parseNumber(value: unknown, field: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`${field} must be a number`);
  }
  return number;
}

export function parsePositiveInt(value: unknown, field: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${field} must be a positive whole number`);
  }
  return number;
}

export function oldStockCutoff() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - OLD_STOCK_DAYS);
  return cutoff;
}

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeek(date = new Date()) {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function receiptNumber() {
  const compact = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `R-${compact}-${suffix}`;
}

export function activityNote(type: ActivityType, receipt?: string | null, reason?: string | null) {
  if (type === "SALE") return receipt ? `Receipt ${receipt}` : "Sale";
  if (type === "RETURN") return [receipt ? `Receipt ${receipt}` : null, reason].filter(Boolean).join(" - ");
  return "Stock added";
}

export type ProductPayload = Pick<
  ProductVariant,
  "id" | "productId" | "productName" | "barcode" | "size" | "color" | "quantity" | "sellingPrice" | "costPrice" | "arrivalDate"
>;
