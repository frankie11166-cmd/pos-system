import Link from "next/link";
import { LOW_STOCK_DEFAULT, oldStockCutoff, startOfDay } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { money } from "@/components/Format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [today, salesCount, lowStockCount, oldStockCount] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: { saleTimestamp: { gte: startOfDay() } },
    }),
    prisma.sale.count({ where: { saleTimestamp: { gte: startOfDay() } } }),
    prisma.productVariant.count({ where: { quantity: { lte: LOW_STOCK_DEFAULT } } }),
    prisma.productVariant.count({ where: { arrivalDate: { lt: oldStockCutoff() } } }),
  ]);

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="subtitle">Today’s shop summary and the fastest ways to work.</p>
      <div className="grid stats">
        <div className="card">
          <div className="stat-label">Today Sales</div>
          <div className="stat-value">{money(today._sum.totalAmount)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Sales Count</div>
          <div className="stat-value">{salesCount}</div>
        </div>
        <div className="card">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value">{lowStockCount}</div>
        </div>
        <div className="card">
          <div className="stat-label">Old Stock</div>
          <div className="stat-value">{oldStockCount}</div>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 18 }}>
        <div className="button-row" style={{ marginTop: 0 }}>
          <Link className="btn soft" href="/stock/add">Add Stock</Link>
          <Link className="btn soft" href="/sell">Sell Product</Link>
          <Link className="btn soft" href="/return">Return Product</Link>
          <Link className="btn secondary" href="/inventory">View Inventory</Link>
        </div>
      </div>
    </>
  );
}
