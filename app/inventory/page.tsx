import Link from "next/link";
import { dateOnly, money } from "@/components/Format";
import { LOW_STOCK_DEFAULT, oldStockCutoff } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const items = await prisma.productVariant.findMany({
    where: query
      ? {
          OR: [
            { productId: { contains: query } },
            { productName: { contains: query } },
            { barcode: { contains: query } },
            { size: { contains: query } },
            { color: { contains: query } },
          ],
        }
      : undefined,
    orderBy: [{ productId: "asc" }, { size: "asc" }, { color: "asc" }],
  });
  const cutoff = oldStockCutoff();
  const groups = Array.from(
    items
      .reduce((map, item) => {
        const key = `${item.productId}::${item.productName}`;
        const current = map.get(key) || {
          productId: item.productId,
          productName: item.productName,
          totalQuantity: 0,
          prices: new Set<number>(),
          colors: new Set<string>(),
          sizes: new Set<string>(),
          variants: [] as typeof items,
        };
        current.totalQuantity += item.quantity;
        current.prices.add(item.sellingPrice);
        current.colors.add(item.color);
        current.sizes.add(item.size);
        current.variants.push(item);
        map.set(key, current);
        return map;
      }, new Map<string, { productId: string; productName: string; totalQuantity: number; prices: Set<number>; colors: Set<string>; sizes: Set<string>; variants: typeof items }>())
      .values(),
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="subtitle">Current stock by product, size, and color.</p>
        </div>
        <Link className="btn secondary" href="/api/export/inventory">
          Export CSV
        </Link>
      </div>
      <form className="panel search-panel" action="/inventory">
        <div className="field">
          <label>Search Inventory</label>
          <input name="q" defaultValue={query} placeholder="Search product ID, name, barcode, size, or color" />
        </div>
        <div className="button-row">
          <button className="btn secondary" type="submit">
            Search
          </button>
          {query && (
            <Link className="btn secondary" href="/inventory">
              Clear
            </Link>
          )}
        </div>
      </form>
      <div className="panel">
        <div className="inventory-list">
          <div className="inventory-list-head">
            <span>Product ID</span>
            <span>Name</span>
            <span>Price</span>
            <span>Status</span>
          </div>
          {groups.map((group) => (
            <details className="inventory-detail" key={`${group.productId}-${group.productName}`}>
              <summary>
                <span>{group.productId}</span>
                <span>{group.productName}</span>
                <span>{formatPriceRange(Array.from(group.prices))}</span>
                <span>
                  {group.variants.some((item) => item.quantity <= LOW_STOCK_DEFAULT) && <span className="warning">Low stock</span>}
                  {group.variants.some((item) => item.arrivalDate < cutoff) && <span className="warning">Old stock</span>}
                  {group.variants.every((item) => item.quantity > LOW_STOCK_DEFAULT && item.arrivalDate >= cutoff) && "OK"}
                </span>
              </summary>
              <div className="variant-table">
                <table>
                  <thead>
                    <tr>
                      <th>Color</th>
                      <th>Size</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Arrival</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.variants.map((item) => (
                      <tr key={item.id}>
                        <td>{item.color}</td>
                        <td>{item.size}</td>
                        <td>{item.quantity}</td>
                        <td>{money(item.sellingPrice)}</td>
                        <td>{dateOnly(item.arrivalDate)}</td>
                        <td>
                          {item.quantity <= LOW_STOCK_DEFAULT && <span className="warning">Low stock</span>}
                          {item.arrivalDate < cutoff && <span className="warning">Old stock</span>}
                          {item.quantity > LOW_STOCK_DEFAULT && item.arrivalDate >= cutoff && "OK"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
        {items.length === 0 && <p className="subtitle">No stock has been added yet.</p>}
      </div>
    </>
  );
}

function formatPriceRange(prices: number[]) {
  if (prices.length === 0) return "-";
  const sorted = prices.sort((a, b) => a - b);
  if (sorted[0] === sorted[sorted.length - 1]) return money(sorted[0]);
  return `${money(sorted[0])} - ${money(sorted[sorted.length - 1])}`;
}
