import Link from "next/link";
import { DeleteUserButton } from "@/components/DeleteUserButton";
import { UserForm } from "@/components/UserForm";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  await requireOwner();

  const users = await prisma.userAccount.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { activities: true },
      },
    },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="subtitle">Create owner and staff PINs for the POS.</p>
        </div>
      </div>
      <UserForm />
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.role === "OWNER" ? "Owner" : "Staff"}</td>
                  <td>{user.isActive ? "Active" : "Inactive"}</td>
                  <td>{user._count.activities}</td>
                  <td>{user.createdAt.toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="btn secondary" href={`/users/${user.id}`}>
                        Dashboard
                      </Link>
                      {user.role === "STAFF" && (
                        <DeleteUserButton disabled={!user.isActive} userId={user.id} userName={user.name} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
