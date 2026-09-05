import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Only admins can approve purchase orders" }, { status: 403 });
  }

  const { id } = await params;

  const result = await db.query(
    `UPDATE purchase_orders SET status='approved', approved_by=$1, updated_at=NOW()
     WHERE id=$2 AND status='pending_approval' RETURNING *`,
    [session!.id, id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Order not found or not pending approval" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
