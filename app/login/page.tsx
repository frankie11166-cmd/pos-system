import { connection } from "next/server";
import { LoginForm } from "@/components/LoginForm";
import { prisma } from "@/lib/prisma";

export default async function LoginPage() {
  await connection();
  const userCount = await prisma.userAccount.count();

  return <LoginForm setupMode={userCount === 0} />;
}
