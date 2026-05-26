import { findUserByPin, setSession, validatePin } from "@/lib/auth";
import { jsonError } from "@/lib/helpers";

export async function POST(request: Request) {
  const body = await request.json();
  const pin = String(body.pin || "").trim();

  if (!validatePin(pin)) return jsonError("PIN must be exactly 4 digits.");

  const user = await findUserByPin(pin);
  if (!user) return jsonError("PIN was not found.", 401);

  await setSession({ id: user.id, name: user.name, role: user.role });
  return Response.json({ id: user.id, name: user.name, role: user.role });
}
