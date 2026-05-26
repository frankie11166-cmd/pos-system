import { AddStockForm } from "@/components/AddStockForm";
import { dateTime } from "@/components/Format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AddStockPage() {
  const records = await prisma.activityHistory.findMany({
    where: { actionType: "STOCK_ADDED" },
    orderBy: { timestamp: "desc" },
    take: 25,
  });

  return (
    <>
      <h1 className="page-title">Add Stock</h1>
      <p className="subtitle">Add one delivery batch by entering quantities for all received sizes at once.</p>
      <AddStockForm />
      <section className="panel" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Recent Stock Added</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Product</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty Added</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{dateTime(record.timestamp)}</td>
                  <td>
                    {record.productId} - {record.productName}
                  </td>
                  <td>{record.size}</td>
                  <td>{record.color}</td>
                  <td>{record.quantityChanged}</td>
                  <td>{record.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && <p className="subtitle">No stock records yet.</p>}
        </div>
      </section>
    </>
  );
}
