import { UserRole } from "@prisma/client";
import { hashPin, setSession, validatePin } from "@/lib/auth";
import { jsonError } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const existingUsers = await prisma.userAccount.count();
  if (existingUsers > 0) {
    return jsonError("Owner setup is already complete.", 403);
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const pin = String(body.pin || "").trim();

  if (!name) return jsonError("Owner name is required.");
  if (!validatePin(pin)) return jsonError("PIN must be exactly 4 digits.");

  const user = await prisma.userAccount.create({
    data: {
      name,
      pinHash: hashPin(pin),
      role: UserRole.OWNER,
    },
  });

  await setSession({ id: user.id, name: user.name, role: user.role });
  return Response.json({ id: user.id, name: user.name, role: user.role });
}
