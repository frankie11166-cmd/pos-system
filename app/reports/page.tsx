import Link from "next/link";
import { money } from "@/components/Format";
import { startOfDay, startOfMonth, startOfWeek } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ chart?: string }>;
}) {
  const params = await searchParams;
  const chartMode = params.chart === "hourly" ? "hourly" : "daily";
  const now = new Date();
  const chartStart = new Date(now);
  chartStart.setDate(chartStart.getDate() - 13);
  chartStart.setHours(0, 0, 0, 0);
  const hourlyStart = startOfDay(now);

  const [dailySales, weeklySales, monthlySales, bestSelling, saleItems, chartSales] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: { saleTimestamp: { gte: startOfDay(now) } },
    }),
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: { saleTimestamp: { gte: startOfWeek(now) } },
    }),
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: { saleTimestamp: { gte: startOfMonth(now) } },
    }),
    prisma.saleItem.groupBy({
      by: ["productId", "productName", "size", "color"],
      _sum: { quantitySold: true, finalAmount: true },
      orderBy: { _sum: { quantitySold: "desc" } },
      take: 10,
    }),
    prisma.saleItem.findMany({
      include: { productVariant: true },
    }),
    prisma.sale.findMany({
      where: { saleTimestamp: { gte: chartMode === "hourly" ? hourlyStart : chartStart } },
      orderBy: { saleTimestamp: "asc" },
    }),
  ]);

  const profitEstimate = saleItems.reduce((sum, item) => {
    const cost = item.productVariant.costPrice;
    if (cost == null) return sum;
    return sum + (item.sellingPrice - cost) * item.quantitySold - item.discountAmount;
  }, 0);
  const chartData = chartMode === "hourly" ? buildHourlySalesChart(chartSales) : buildDailySalesChart(chartSales, chartStart, now);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="subtitle">Basic sales, product, profit, and return summaries.</p>
        </div>
        <div className="button-row compact">
          <Link className="btn" href="/api/export/all">
            Backup All Data
          </Link>
          <Link className="btn secondary" href="/api/export/sales">
            Export Sales CSV
          </Link>
          <Link className="btn secondary" href="/api/export/returns">
            Export Returns CSV
          </Link>
        </div>
      </div>
      <div className="grid stats">
        <ReportCard label="Daily Sales" count={dailySales._count} value={dailySales._sum.totalAmount} />
        <ReportCard label="Weekly Sales" count={weeklySales._count} value={weeklySales._sum.totalAmount} />
        <ReportCard label="Monthly Sales" count={monthlySales._count} value={monthlySales._sum.totalAmount} />
        <div className="card">
          <div className="stat-label">Profit Estimate</div>
          <div className="stat-value">{money(profitEstimate)}</div>
        </div>
      </div>
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="section-header">
          <h2 style={{ marginTop: 0 }}>Sales Chart</h2>
          <div className="segmented">
            <Link className={chartMode === "hourly" ? "active" : ""} href="/reports?chart=hourly">
              Hourly
            </Link>
            <Link className={chartMode === "daily" ? "active" : ""} href="/reports?chart=daily">
              Daily
            </Link>
          </div>
        </div>
        <SalesLineChart data={chartData} title={chartMode === "hourly" ? "Hourly sales today" : "Daily sales for the last 14 days"} />
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Best-Selling Products</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty Sold</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              {bestSelling.map((item) => (
                <tr key={`${item.productId}-${item.size}-${item.color}`}>
                  <td>
                    {item.productId} - {item.productName}
                  </td>
                  <td>{item.size}</td>
                  <td>{item.color}</td>
                  <td>{item._sum.quantitySold || 0}</td>
                  <td>{money(item._sum.finalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bestSelling.length === 0 && <p className="subtitle">No sales yet.</p>}
        </div>
      </section>
    </>
  );
}

function ReportCard({ label, count, value }: { label: string; count: number; value: number | null }) {
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{money(value)}</div>
      <div className="subtitle" style={{ margin: "6px 0 0" }}>
        {count} sale{count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

type ChartPoint = {
  label: string;
  total: number;
};

function buildDailySalesChart(sales: { saleTimestamp: Date; totalAmount: number }[], start: Date, end: Date): ChartPoint[] {
  const days: ChartPoint[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push({ label: cursor.toLocaleDateString(undefined, { month: "short", day: "numeric" }), total: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const sale of sales) {
    const diff = Math.floor((startOfDay(sale.saleTimestamp).getTime() - start.getTime()) / 86400000);
    if (days[diff]) days[diff].total += sale.totalAmount;
  }

  return days;
}

function buildHourlySalesChart(sales: { saleTimestamp: Date; totalAmount: number }[]): ChartPoint[] {
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, "0")}:00`,
    total: 0,
  }));

  for (const sale of sales) {
    hours[sale.saleTimestamp.getHours()].total += sale.totalAmount;
  }

  return hours;
}

function SalesLineChart({ data, title }: { data: ChartPoint[]; title: string }) {
  const width = 720;
  const height = 260;
  const padding = 34;
  const max = Math.max(...data.map((point) => point.total), 1);
  const points = data.map((point, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - (point.total / max) * (height - padding * 2);
    return { ...point, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="chart-wrap">
      <p className="subtitle" style={{ marginBottom: 8 }}>{title}</p>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <polyline className="chart-grid" points={`${padding},${height - padding} ${width - padding},${height - padding}`} />
        <polyline className="chart-line" points={line} />
        {points.map((point) => (
          <g key={point.label}>
            <circle className="chart-dot" cx={point.x} cy={point.y} r="4" />
            <text className="chart-value" x={point.x} y={point.y - 10} textAnchor="middle">
              {point.total > 0 ? money(point.total) : ""}
            </text>
          </g>
        ))}
        {points.map((point, index) =>
          index % 2 === 0 || index === points.length - 1 ? (
            <text key={point.label} className="chart-label" x={point.x} y={height - 10} textAnchor="middle">
              {point.label}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
