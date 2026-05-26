import { prisma } from "@/lib/prisma";

export async function GET() {
  const history = await prisma.activityHistory.findMany({
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  return Response.json(history);
}
