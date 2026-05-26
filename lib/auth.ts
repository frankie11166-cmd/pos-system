import { createHmac, createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: number;
  name: string;
  role: UserRole;
};

const COOKIE_NAME = "pos_session";
const SESSION_DAYS = 7;

type SessionPayload = SessionUser & {
  exp: number;
};

export function validatePin(pin: unknown) {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

export function hashPin(pin: string) {
  return createHash("sha256").update(`${pin}:${sessionSecret()}`).digest("hex");
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [payloadPart, signature] = raw.split(".");
  if (!payloadPart || !signature || !safeEqual(signature, sign(payloadPart))) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.id || !payload.name || !payload.role || Date.now() > payload.exp) return null;
    return { id: payload.id, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireOwner() {
  const session = await requireSession();
  if (session.role !== "OWNER") {
    redirect("/dashboard");
  }
  return session;
}

export async function setSession(user: SessionUser) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ ...user, exp }), "utf8").toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function findUserByPin(pin: string) {
  return prisma.userAccount.findFirst({
    where: {
      pinHash: hashPin(pin),
      isActive: true,
    },
  });
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.DATABASE_URL || "local-development-session-secret";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
