import { dateTime } from "@/components/Format";
import { HistoryFilters } from "@/components/HistoryFilters";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = {
  STOCK_ADDED: "Stock Added",
  SALE: "Sale",
  RETURN: "Return",
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; date?: string }>;
}) {
  const params = await searchParams;
  const action = params.action?.trim() || "";
  const date = params.date?.trim() || "";
  const start = date ? new Date(`${date}T00:00:00`) : null;
  const end = date ? new Date(`${date}T23:59:59.999`) : null;
  const records = await prisma.activityHistory.findMany({
    where: {
      ...(Object.values(ActivityType).includes(action as ActivityType) ? { actionType: action as ActivityType } : {}),
      ...(start && end && Number.isFinite(start.getTime()) && Number.isFinite(end.getTime())
        ? { timestamp: { gte: start, lte: end } }
        : {}),
    },
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  return (
    <>
      <h1 className="page-title">Activity History</h1>
      <p className="subtitle">Every stock addition, sale, and return is recorded here.</p>
      <HistoryFilters action={action} date={date} />
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Product</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td colSpan={3}>
                  <details className="history-detail">
                    <summary>
                      <span>{dateTime(record.timestamp)}</span>
                      <span>{labels[record.actionType]}</span>
                      <span>
                        {record.productId} - {record.productName}
                      </span>
                    </summary>
                    <div className="detail-grid">
                      <div>
                        <strong>Size</strong>
                        <span>{record.size}</span>
                      </div>
                      <div>
                        <strong>Color</strong>
                        <span>{record.color}</span>
                      </div>
                      <div>
                        <strong>Quantity Change</strong>
                        <span>{record.quantityChanged}</span>
                      </div>
                      <div>
                        <strong>Note</strong>
                        <span>{record.note || "-"}</span>
                      </div>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <p className="subtitle">No activity yet.</p>}
      </div>
    </>
  );
}
