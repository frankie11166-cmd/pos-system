"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { money } from "./Format";
import { Product } from "./ProductSearch";

type Status = { type: "success" | "error"; text: string } | null;
type SellFormProps = {
  userRole: "OWNER" | "STAFF";
};

export function SellForm({ userRole }: SellFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [chosenProductKey, setChosenProductKey] = useState("");
  const [chosenColor, setChosenColor] = useState("");
  const [chosenSize, setChosenSize] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function search() {
      if (!query.trim()) {
        setResults([]);
        setChosenProductKey("");
        setChosenColor("");
        setChosenSize("");
        setSelected(null);
        return;
      }

      const response = await fetch(`/api/inventory/search?scope=product&q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (response.ok) setResults(await response.json());
    }

    const timeout = window.setTimeout(search, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  const products = useMemo(() => {
    const map = new Map<string, { productId: string; productName: string; totalQuantity: number }>();
    for (const product of results) {
      const key = `${product.productId}::${product.productName}`;
      const current = map.get(key);
      if (current) {
        current.totalQuantity += product.quantity;
      } else {
        map.set(key, { productId: product.productId, productName: product.productName, totalQuantity: product.quantity });
      }
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }));
  }, [results]);

  const variants = useMemo(
    () => results.filter((item) => `${item.productId}::${item.productName}` === chosenProductKey),
    [chosenProductKey, results],
  );
  const colors = Array.from(new Set(variants.map((item) => item.color)));
  const sizes = Array.from(new Set(variants.filter((item) => !chosenColor || item.color === chosenColor).map((item) => item.size)));

  function selectVariant(color: string, size: string) {
    setChosenColor(color);
    setChosenSize(size);
    const variant = variants.find((item) => item.color === color && item.size === size) || null;
    setSelected(variant);
  }

  async function submit(formData: FormData) {
    if (!selected) {
      setStatus({ type: "error", text: "Select product, color, and size before saving the sale." });
      return;
    }
    setSaving(true);
    setStatus(null);

    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productVariantId: selected.id,
        quantitySold: formData.get("quantitySold"),
        discountAmount: formData.get("discountAmount"),
        approvalPrice: formData.get("approvalPrice"),
        paymentMethod: formData.get("paymentMethod"),
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setStatus({ type: "error", text: data.error || "Could not save sale." });
      return;
    }

    setStatus({ type: "success", text: `Sale saved. Receipt: ${data.receiptNumber}. Total: ${money(data.totalAmount)}.` });
    setSelected(null);
    setChosenProductKey("");
    setChosenSize("");
    setChosenColor("");
    router.refresh();
  }

  return (
    <div className="grid">
      <div className="panel checkout-panel">
        <div className="field">
          <label>Search Product ID Or Name</label>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product ID or name" />
        </div>
        {products.length > 0 && (
          <form action={submit} className="checkout-form">
            <div className="sale-tile-grid" key={selected?.id ?? "empty-sale"}>
              <div className="field sale-input-tile">
                <label>Product</label>
                <select
                  value={chosenProductKey}
                  onChange={(event) => {
                    setChosenProductKey(event.target.value);
                    setChosenColor("");
                    setChosenSize("");
                    setSelected(null);
                  }}
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.key} value={product.key}>
                      {product.productId} - {product.productName} ({product.totalQuantity} total)
                    </option>
                  ))}
                </select>
              </div>
              <div className="field sale-input-tile">
                <label>Color</label>
                <select
                  value={chosenColor}
                  disabled={!chosenProductKey}
                  onChange={(event) => {
                    setChosenColor(event.target.value);
                    setChosenSize("");
                    setSelected(null);
                  }}
                >
                  <option value="">Select color</option>
                  {colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field sale-input-tile">
                <label>Size</label>
                <select value={chosenSize} disabled={!chosenColor} onChange={(event) => selectVariant(chosenColor, event.target.value)}>
                  <option value="">Select size</option>
                  {sizes.map((size) => {
                    const variant = variants.find((item) => item.color === chosenColor && item.size === size);
                    return (
                      <option key={size} value={size}>
                        {size} ({variant?.quantity ?? 0} available)
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="sale-info-tile">
                <span>Available</span>
                <strong>{selected ? selected.quantity : "-"}</strong>
              </div>
              <div className="field sale-input-tile">
                <label>Quantity Sold</label>
                <input name="quantitySold" required disabled={!selected} min="1" max={selected?.quantity} type="number" defaultValue="1" />
              </div>
              <div className="field sale-input-tile">
                <label>Approval Price</label>
                <input name="approvalPrice" required disabled={!selected} min="0" step="0.01" type="number" defaultValue={selected?.sellingPrice ?? ""} />
              </div>
              <div className="field sale-input-tile">
                <label>Discount Amount</label>
                <input name="discountAmount" disabled={!selected} min="0" max={userRole === "STAFF" ? 50 : undefined} step="0.01" type="number" defaultValue="0" />
                {userRole === "STAFF" && <span className="field-note">Staff discount limit: 50.</span>}
              </div>
              <div className="field sale-input-tile">
                <label>Payment Method</label>
                <select name="paymentMethod" required disabled={!selected} defaultValue="Cash">
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="WeChat/Alipay">WeChat/Alipay</option>
                </select>
              </div>
            </div>
            <div className="button-row">
              <button className="btn" disabled={saving || !selected} type="submit">
                {saving ? "Saving..." : "Save Sale"}
              </button>
            </div>
          </form>
        )}
      </div>
      {status && <div className={`message ${status.type}`}>{status.text}</div>}
    </div>
  );
}
