"use client";

import { useEffect, useState } from "react";
import { money } from "./Format";

export type Product = {
  id: number;
  productId: string;
  productName: string;
  barcode?: string | null;
  size: string;
  color: string;
  quantity: number;
  sellingPrice: number;
};

type Props = {
  onSelect: (product: Product) => void;
};

export function ProductSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function search() {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      const response = await fetch(`/api/inventory/search?q=${encodeURIComponent(query)}`, {
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

  return (
    <div className="panel">
      <div className="field">
        <label>Search Product</label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Product ID, name, size, color, or barcode"
        />
      </div>
      {results.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.productId} - {product.productName}
                  </td>
                  <td>{product.size}</td>
                  <td>{product.color}</td>
                  <td>{product.quantity}</td>
                  <td>{money(product.sellingPrice)}</td>
                  <td>
                    <button className="btn secondary" type="button" onClick={() => onSelect(product)}>
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
  );
}
