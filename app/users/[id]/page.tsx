import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityType } from "@prisma/client";
import { dateTime } from "@/components/Format";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UserDashboardPageProps = {
  params: Promise<{ id: string }>;
};

const actionLabels: Record<ActivityType, string> = {
  STOCK_ADDED: "Stock added",
  SALE: "Sale",
  RETURN: "Return",
};

export default async function UserDashboardPage({ params }: UserDashboardPageProps) {
  await requireOwner();

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) notFound();

  const [user, summaries, activities] = await Promise.all([
    prisma.userAccount.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.activityHistory.groupBy({
      by: ["actionType"],
      where: { userAccountId: userId },
      _count: { _all: true },
      _sum: { quantityChanged: true },
    }),
    prisma.activityHistory.findMany({
      where: { userAccountId: userId },
      orderBy: { timestamp: "desc" },
      take: 100,
    }),
  ]);

  if (!user) notFound();

  const summaryMap = new Map(summaries.map((item) => [item.actionType, item]));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{user.name}</h1>
          <p className="subtitle">
            {user.role === "OWNER" ? "Owner" : "Staff"} account - {user.isActive ? "Active" : "Inactive"} - Created{" "}
            {user.createdAt.toLocaleDateString()}
          </p>
        </div>
        <Link className="btn secondary" href="/users">
          Back to Users
        </Link>
      </div>

      <section className="stats grid">
        {([ActivityType.SALE, ActivityType.RETURN, ActivityType.STOCK_ADDED] as ActivityType[]).map((actionType) => {
          const summary = summaryMap.get(actionType);
          return (
            <div className="card" key={actionType}>
              <div className="stat-label">{actionLabels[actionType]}</div>
              <div className="stat-value">{summary?._count._all ?? 0}</div>
              <p className="subtitle">Net quantity: {summary?._sum.quantityChanged ?? 0}</p>
            </div>
          );
        })}
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="section-header">
          <h2 style={{ margin: 0 }}>Activity</h2>
          <span className="subtitle" style={{ margin: 0 }}>
            Latest 100 records
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Product</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td>{dateTime(activity.timestamp)}</td>
                  <td>{actionLabels[activity.actionType]}</td>
                  <td>
                    {activity.productId} - {activity.productName}
                  </td>
                  <td>{activity.size}</td>
                  <td>{activity.color}</td>
                  <td>{activity.quantityChanged}</td>
                  <td>{activity.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {activities.length === 0 && <p className="subtitle">No actions have been recorded for this user yet.</p>}
        </div>
      </section>
    </>
  );
}
