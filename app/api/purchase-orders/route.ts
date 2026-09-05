import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.query(`
    SELECT po.*, s.name AS supplier_name,
      u.name AS created_by_name,
      a.name AS approved_by_name,
      COUNT(poi.id) AS item_count
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN users u ON po.created_by = u.id
    LEFT JOIN users a ON po.approved_by = a.id
    LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
    GROUP BY po.id, s.name, u.name, a.name
    ORDER BY po.created_at DESC
  `);

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["admin", "engineer"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { supplier_id, items, notes } = await req.json();

  const poNumber = `PO-${Date.now()}`;
  const totalCost = items.reduce((sum: number, item: { quantity: number; unit_cost: number }) =>
    sum + item.quantity * item.unit_cost, 0);

  const poResult = await db.query(
    `INSERT INTO purchase_orders (po_number, supplier_id, created_by, notes, total_cost, status)
     VALUES ($1,$2,$3,$4,$5,'draft') RETURNING *`,
    [poNumber, supplier_id, session!.id, notes, totalCost]
  );

  const po = poResult.rows[0];

  for (const item of items) {
    await db.query(
      `INSERT INTO purchase_order_items (po_id, part_id, quantity, unit_cost) VALUES ($1,$2,$3,$4)`,
      [po.id, item.part_id, item.quantity, item.unit_cost]
    );
  }

  return NextResponse.json(po, { status: 201 });
}
