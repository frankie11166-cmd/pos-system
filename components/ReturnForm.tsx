"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dateTime, money } from "./Format";
import { Product } from "./ProductSearch";

type Status = { type: "success" | "error"; text: string } | null;
type ReturnProduct = Product & {
  receiptNumber: string;
  saleTimestamp: string;
  soldQuantity: number;
};
type SaleLookup = {
  id: number;
  receiptNumber: string;
  saleTimestamp: string;
  totalAmount: number;
  items: Array<{
    productVariantId: number;
    productId: string;
    productName: string;
    size: string;
    color: string;
    quantitySold: number;
    sellingPrice: number;
  }>;
};

type ReturnFormProps = {
  userRole: "OWNER" | "STAFF";
};

export function ReturnForm({ userRole }: ReturnFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReturnProduct | null>(null);
  const [receipt, setReceipt] = useState("");
  const [productIdQuery, setProductIdQuery] = useState("");
  const [receiptItems, setReceiptItems] = useState<ReturnProduct[]>([]);
  const [productMatches, setProductMatches] = useState<ReturnProduct[]>([]);
  const [soldSuggestions, setSoldSuggestions] = useState<ReturnProduct[]>([]);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateSales, setDateSales] = useState<SaleLookup[]>([]);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function searchSoldItems() {
      const query = receipt.trim();
      if (query.length < 1) {
        setSoldSuggestions([]);
        return;
      }

      const response = await fetch(`/api/sales?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (!response.ok) return;
      const sales = await response.json();
      setSoldSuggestions(sales.flatMap((sale: SaleLookup) => saleItemsToReturnProducts(sale)));
    }

    const timeout = window.setTimeout(searchSoldItems, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [receipt]);

  useEffect(() => {
    const controller = new AbortController();

    async function searchSoldProductIds() {
      const query = productIdQuery.trim();
      if (query.length < 1) {
        setProductMatches([]);
        return;
      }

      const response = await fetch(`/api/sales?productId=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (!response.ok) return;

      const sales = await response.json();
      const matches = sales.flatMap((sale: SaleLookup) =>
        saleItemsToReturnProducts({
          ...sale,
          items: sale.items.filter((item) => item.productId.toLowerCase().includes(query.toLowerCase())),
        }),
      );
      setProductMatches(matches);
    }

    const timeout = window.setTimeout(searchSoldProductIds, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [productIdQuery]);

  async function findReceipt() {
    if (!receipt.trim()) return;
    setStatus(null);
    const response = await fetch(`/api/sales?receipt=${encodeURIComponent(receipt.trim())}`);
    const data = await response.json();

    if (!response.ok || !data) {
      setReceiptItems([]);
      setStatus({ type: "error", text: "No sale found for that receipt number." });
      return;
    }

    const items = saleItemsToReturnProducts(data);
    setReceiptItems(items);
    setStatus({ type: "success", text: `This receipt has ${items.length} sold item(s). Select the shoe being returned.` });
  }

  function saleItemsToReturnProducts(sale: SaleLookup): ReturnProduct[] {
    return sale.items.map((item) => ({
        id: item.productVariantId,
        productId: item.productId,
        productName: item.productName,
        size: item.size,
        color: item.color,
        quantity: item.quantitySold,
        sellingPrice: item.sellingPrice,
        receiptNumber: sale.receiptNumber,
        saleTimestamp: sale.saleTimestamp,
        soldQuantity: item.quantitySold,
      }));
  }

  async function findSalesByDate() {
    if (!saleDate) return;
    setStatus(null);
    const response = await fetch(`/api/sales?date=${encodeURIComponent(saleDate)}`);
    const data = await response.json();

    if (!response.ok) {
      setDateSales([]);
      setStatus({ type: "error", text: data.error || "Could not search sales by date." });
      return;
    }

    setDateSales(data);
    if (data.length === 0) {
      setStatus({ type: "error", text: "No sales found for that date." });
    }
  }

  async function findProductId() {
    if (!productIdQuery.trim()) return;
    setStatus(null);
    const response = await fetch(`/api/sales?productId=${encodeURIComponent(productIdQuery.trim())}`);
    const data = await response.json();

    if (!response.ok) {
      setProductMatches([]);
      setStatus({ type: "error", text: data.error || "Could not search product ID." });
      return;
    }

    const matches = data.flatMap((sale: SaleLookup) =>
      saleItemsToReturnProducts({
        ...sale,
        items: sale.items.filter((item) => item.productId.toLowerCase().includes(productIdQuery.trim().toLowerCase())),
      }),
    );
    setProductMatches(matches);
    if (data.length === 0) {
      setStatus({ type: "error", text: "No sold products found for that product ID." });
    } else {
      setStatus({ type: "success", text: `Found ${matches.length} sold item(s) for this product ID.` });
    }
  }

  function chooseReceipt(sale: SaleLookup) {
    setReceipt(sale.receiptNumber);
    setReceiptItems(saleItemsToReturnProducts(sale));
    setStatus({ type: "success", text: `Loaded receipt ${sale.receiptNumber}. Select the item to return.` });
  }

  async function submit(formData: FormData) {
    if (!selected) return;
    setSaving(true);
    setStatus(null);

    const response = await fetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productVariantId: selected.id,
        quantityReturned: formData.get("quantityReturned"),
        receiptNumber: formData.get("receiptNumber"),
        reason: formData.get("reason"),
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setStatus({ type: "error", text: data.error || "Could not save return." });
      return;
    }

    setStatus({ type: "success", text: `Return saved for ${data.productName}. Inventory was increased.` });
    setSelected(null);
    router.refresh();
  }

  return (
    <div className="grid">
      <div className="panel">
        <div className="form-grid">
          <div className="field">
            <label>Find By Receipt Number</label>
            <input value={receipt} onChange={(event) => setReceipt(event.target.value)} placeholder="R-202605..." />
          </div>
          <div className="field">
            <label>Find Sales By Date</label>
            <input value={saleDate} onChange={(event) => setSaleDate(event.target.value)} type="date" />
          </div>
          <div className="field">
            <label>Find By Product ID</label>
            <input value={productIdQuery} onChange={(event) => setProductIdQuery(event.target.value)} placeholder="SKU-1001" />
          </div>
        </div>
        <div className="button-row">
          <button className="btn secondary" type="button" onClick={findReceipt}>
            Search Receipt
          </button>
          <button className="btn secondary" type="button" onClick={findSalesByDate}>
            Search Date
          </button>
          <button className="btn secondary" type="button" onClick={findProductId}>
            Search Product ID
          </button>
        </div>
        {soldSuggestions.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Sold Time</th>
                  <th>Receipt</th>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Color</th>
                  <th>Sold Qty</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {soldSuggestions.map((item) => (
                  <tr key={`${item.receiptNumber}-${item.id}`}>
                    <td>{dateTime(item.saleTimestamp)}</td>
                    <td>{item.receiptNumber}</td>
                    <td>
                      {item.productId} - {item.productName}
                    </td>
                    <td>{item.size}</td>
                    <td>{item.color}</td>
                    <td>{item.soldQuantity}</td>
                    <td>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => {
                          setReceipt(item.receiptNumber);
                          setSelected(item);
                        }}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {productMatches.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Color</th>
                  <th>Current Qty</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productMatches.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.productId} - {item.productName}
                    </td>
                    <td>{item.size}</td>
                    <td>{item.color}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <button className="btn secondary" type="button" onClick={() => setSelected(item)}>
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {dateSales.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Receipt</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dateSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{dateTime(sale.saleTimestamp)}</td>
                    <td>{sale.receiptNumber}</td>
                    <td>{sale.items.map((item) => `${item.productName} ${item.size}/${item.color}`).join(", ")}</td>
                    <td>{money(sale.totalAmount)}</td>
                    <td>
                      <button className="btn secondary" type="button" onClick={() => chooseReceipt(sale)}>
                        Load
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {receiptItems.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Color</th>
                  <th>Sold Qty</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {receiptItems.map((item) => (
                  <tr key={`${item.id}-${item.size}-${item.color}`}>
                    <td>
                      {item.productId} - {item.productName}
                    </td>
                    <td>{item.size}</td>
                    <td>{item.color}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <button className="btn secondary" type="button" onClick={() => setSelected(item)}>
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && (
        <form action={submit} className="panel">
          <h2 style={{ marginTop: 0 }}>Return {selected.productName}</h2>
          <p className="subtitle">
            Sold on {dateTime(selected.saleTimestamp)} - Receipt {selected.receiptNumber} - {selected.productId} - Size {selected.size} - {selected.color}
          </p>
          <div className="form-grid">
            <div className="field">
              <label>Receipt Number</label>
              <input name="receiptNumber" required readOnly value={selected.receiptNumber} />
            </div>
            <div className="field">
              <label>Quantity Returned</label>
              <input name="quantityReturned" required min="1" max={selected.soldQuantity} type="number" defaultValue="1" />
            </div>
            <div className="field">
              <label>Reason Or Comment</label>
              <input name="reason" placeholder="Wrong size, changed mind, faulty..." required={userRole === "STAFF"} />
              {userRole === "STAFF" && <span className="field-note">Required for staff returns.</span>}
            </div>
          </div>
          <div className="button-row">
            <button className="btn" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save Return"}
            </button>
          </div>
        </form>
      )}
      {status && <div className={`message ${status.type}`}>{status.text}</div>}
    </div>
  );
}
