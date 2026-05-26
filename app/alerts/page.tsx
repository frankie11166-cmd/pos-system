import { dateOnly, money } from "@/components/Format";
import { LOW_STOCK_DEFAULT, oldStockCutoff } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [lowStock, oldStock] = await Promise.all([
    prisma.productVariant.findMany({
      where: { quantity: { lte: LOW_STOCK_DEFAULT } },
      orderBy: [{ quantity: "asc" }, { productId: "asc" }],
    }),
    prisma.productVariant.findMany({
      where: { arrivalDate: { lt: oldStockCutoff() } },
      orderBy: { arrivalDate: "asc" },
    }),
  ]);

  return (
    <>
      <h1 className="page-title">Alerts</h1>
      <p className="subtitle">Low stock uses quantity 1 or below. Old stock is older than 180 days.</p>
      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Low Stock</h2>
        <AlertTable items={lowStock} />
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Old Stock</h2>
        <AlertTable items={oldStock} />
      </section>
    </>
  );
}

function AlertTable({ items }: { items: Awaited<ReturnType<typeof prisma.productVariant.findMany>> }) {
  if (items.length === 0) return <p className="subtitle">No alerts here.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Size</th>
            <th>Color</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Arrival</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.productId} - {item.productName}
              </td>
              <td>{item.size}</td>
              <td>{item.color}</td>
              <td>{item.quantity}</td>
              <td>{money(item.sellingPrice)}</td>
              <td>{dateOnly(item.arrivalDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
