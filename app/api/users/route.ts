import { UserRole } from "@prisma/client";
import { getSession, hashPin, validatePin } from "@/lib/auth";
import { jsonError } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Please log in.", 401);
  if (session.role !== "OWNER") return jsonError("Only the owner can view users.", 403);

  const users = await prisma.userAccount.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return Response.json(users);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("Please log in.", 401);
  if (session.role !== "OWNER") return jsonError("Only the owner can create users.", 403);

  const body = await request.json();
  const name = String(body.name || "").trim();
  const pin = String(body.pin || "").trim();
  const role = String(body.role || "").trim().toUpperCase();

  if (!name) return jsonError("Name is required.");
  if (!validatePin(pin)) return jsonError("PIN must be exactly 4 digits.");
  if (role !== UserRole.OWNER && role !== UserRole.STAFF) return jsonError("Role must be owner or staff.");

  try {
    const user = await prisma.userAccount.create({
      data: {
        name,
        pinHash: hashPin(pin),
        role: role as UserRole,
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return Response.json(user);
  } catch {
    return jsonError("That PIN is already used by another account.");
  }
}
