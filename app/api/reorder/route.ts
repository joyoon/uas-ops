import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runReorderCheck } from "@/lib/reorder";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin" && session.role !== "engineer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await runReorderCheck(session.id);
  return NextResponse.json(result);
}
