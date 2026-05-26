import { getSession } from "@/lib/auth";
import { jsonError } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return jsonError("Please log in.", 401);
  if (session.role !== "OWNER") return jsonError("Only the owner can delete staff accounts.", 403);

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) return jsonError("User is invalid.");

  if (userId === session.id) {
    return jsonError("You cannot delete your own owner account.", 403);
  }

  const user = await prisma.userAccount.findUnique({ where: { id: userId } });
  if (!user) return jsonError("User was not found.", 404);
  if (user.role !== "STAFF") return jsonError("Only staff accounts can be deleted here.", 403);

  const updated = await prisma.userAccount.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  return Response.json(updated);
}
