import { dateTime } from "@/components/Format";
import { ReturnForm } from "@/components/ReturnForm";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReturnPage() {
  const session = await requireSession();
  const returns = await prisma.returnRecord.findMany({
    orderBy: { returnTimestamp: "desc" },
    take: 25,
  });

  return (
    <>
      <h1 className="page-title">Return Product</h1>
      <p className="subtitle">Search by product details, then record the returned quantity and reason.</p>
      <ReturnForm userRole={session.role} />
      <section className="panel" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Recent Returns</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Receipt</th>
                <th>Product</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((record) => (
                <tr key={record.id}>
                  <td>{dateTime(record.returnTimestamp)}</td>
                  <td>{record.receiptNumber || "-"}</td>
                  <td>
                    {record.productId} - {record.productName}
                  </td>
                  <td>{record.size}</td>
                  <td>{record.color}</td>
                  <td>{record.quantityReturned}</td>
                  <td>{record.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {returns.length === 0 && <p className="subtitle">No returns yet.</p>}
        </div>
      </section>
    </>
  );
}
