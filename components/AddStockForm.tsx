"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Status = { type: "success" | "error"; text: string } | null;
const sizes = Array.from({ length: 11 }, (_, index) => String(index + 35));
const colors = ["Black", "White", "Brown", "Gray", "Navy", "Blue", "Red", "Green", "Pink", "Beige", "Tan", "Gold", "Silver"];
type ProductProfile = {
  productId: string;
  productName: string;
  sellingPrice: number;
  costPrice: number | null;
};
type SizeRow = {
  id: number;
  size: string;
  quantity: string;
};

export function AddStockForm() {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [profiles, setProfiles] = useState<ProductProfile[]>([]);
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([{ id: 1, size: "", quantity: "" }]);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProductProfiles() {
      if (!productId.trim()) {
        setProfiles([]);
        return;
      }

      const response = await fetch(`/api/products?productId=${encodeURIComponent(productId.trim())}`, {
        signal: controller.signal,
      });

      if (!response.ok) return;
      const data = await response.json();
      setProfiles(data);

      if (data.length === 1) {
        fillProfile(data[0]);
      }
    }

    const timeout = window.setTimeout(loadProductProfiles, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [productId]);

  function fillProfile(profile: ProductProfile) {
    setProductName(profile.productName);
    setSellingPrice(String(profile.sellingPrice));
    setCostPrice(profile.costPrice == null ? "" : String(profile.costPrice));
  }

  async function submit(formData: FormData) {
    setSaving(true);
    setStatus(null);

    const payload = {
      productId: formData.get("productId"),
      productName: formData.get("productName"),
      barcode: formData.get("barcode"),
      color: formData.get("color"),
      sellingPrice: formData.get("sellingPrice"),
      costPrice: formData.get("costPrice"),
      arrivalDate: formData.get("arrivalDate"),
      items: sizeRows
        .map((row) => ({
          size: row.size,
          quantity: Number(row.quantity || 0),
        }))
        .filter((item) => item.size && item.quantity > 0),
    };
    const response = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setStatus({ type: "error", text: data.error || "Could not add stock." });
      return;
    }

    setStatus({ type: "success", text: `Stock saved for ${data.productName}. Added ${data.totalQuantity} pair(s) across ${data.items.length} size(s).` });
    setSizeRows([{ id: Date.now(), size: "", quantity: "" }]);
    router.refresh();
  }

  function updateSizeRow(id: number, updates: Partial<SizeRow>) {
    setSizeRows((current) => current.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  }

  function addSizeRow() {
    setSizeRows((current) => [...current, { id: Date.now(), size: "", quantity: "" }]);
  }

  function removeSizeRow(id: number) {
    setSizeRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
  }

  const selectedSizes = new Set(sizeRows.map((row) => row.size).filter(Boolean));

  return (
    <form action={submit} className="panel">
      <div className="form-grid">
        <div className="field">
          <label>Product ID</label>
          <input name="productId" required placeholder="SKU-1001" value={productId} onChange={(event) => setProductId(event.target.value)} />
        </div>
        <div className="field">
          <label>Product Name</label>
          {profiles.length > 1 ? (
            <select
              name="productName"
              required
              value={productName}
              onChange={(event) => {
                const profile = profiles.find((item) => item.productName === event.target.value);
                if (profile) fillProfile(profile);
              }}
            >
              <option value="">Select product name</option>
              {profiles.map((profile) => (
                <option key={profile.productName} value={profile.productName}>
                  {profile.productName}
                </option>
              ))}
            </select>
          ) : (
            <input name="productName" required placeholder="Air Runner" value={productName} onChange={(event) => setProductName(event.target.value)} />
          )}
        </div>
        <div className="field">
          <label>Barcode Optional</label>
          <input name="barcode" placeholder="Scan or type barcode" />
        </div>
        <div className="field">
          <label>Color</label>
          <select name="color" required defaultValue="">
            <option value="" disabled>
              Select color
            </option>
            {colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Selling Price</label>
          <input
            name="sellingPrice"
            required
            min="0"
            step="0.01"
            type="number"
            value={sellingPrice}
            onChange={(event) => setSellingPrice(event.target.value)}
          />
        </div>
        <div className="field">
          <label>Cost Price Optional</label>
          <input name="costPrice" min="0" step="0.01" type="number" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} />
        </div>
        <div className="field">
          <label>Arrival Date</label>
          <input name="arrivalDate" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
      </div>
      <section className="size-batch">
        <div className="section-header">
          <div>
            <h2 style={{ margin: 0 }}>Size Quantities</h2>
            <p className="subtitle" style={{ margin: "6px 0 0" }}>
              Add only the sizes included in this delivery.
            </p>
          </div>
          <button className="btn secondary" type="button" onClick={addSizeRow}>
            Add Size
          </button>
        </div>
        <div className="size-row-list">
          {sizeRows.map((row) => (
            <div className="size-row" key={row.id}>
              <div className="field">
                <label>Size</label>
                <select value={row.size} required onChange={(event) => updateSizeRow(row.id, { size: event.target.value })}>
                  <option value="" disabled>
                    Select size
                  </option>
                  {sizes.map((size) => (
                    <option key={size} value={size} disabled={selectedSizes.has(size) && row.size !== size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Quantity</label>
                <input
                  min="1"
                  required
                  type="number"
                  value={row.quantity}
                  onChange={(event) => updateSizeRow(row.id, { quantity: event.target.value })}
                  placeholder="0"
                />
              </div>
              <button className="btn secondary danger-button" disabled={sizeRows.length === 1} type="button" onClick={() => removeSizeRow(row.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
      <div className="button-row">
        <button className="btn" disabled={saving} type="submit">
          {saving ? "Saving..." : "Add Batch Stock"}
        </button>
      </div>
      {status && <div className={`message ${status.type}`}>{status.text}</div>}
    </form>
  );
}
