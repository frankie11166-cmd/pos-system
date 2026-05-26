import { dateTime, money } from "@/components/Format";
import { SellForm } from "@/components/SellForm";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  const session = await requireSession();
  const sales = await prisma.sale.findMany({
    include: { items: true },
    orderBy: { saleTimestamp: "desc" },
    take: 25,
  });

  return (
    <>
      <h1 className="page-title">Sell Product</h1>
      <p className="subtitle">Search, select the exact size and color, then save the sale.</p>
      <SellForm userRole={session.role} />
      <section className="panel" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Recent Sales</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Receipt</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Payment</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.flatMap((sale) =>
                sale.items.map((item) => (
                  <tr key={`${sale.id}-${item.id}`}>
                    <td>{dateTime(sale.saleTimestamp)}</td>
                    <td>{sale.receiptNumber}</td>
                    <td>
                      {item.productId} - {item.productName} - {item.size}/{item.color}
                    </td>
                    <td>{item.quantitySold}</td>
                    <td>{sale.paymentMethod}</td>
                    <td>{money(item.finalAmount)}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
          {sales.length === 0 && <p className="subtitle">No sales yet.</p>}
        </div>
      </section>
    </>
  );
}
