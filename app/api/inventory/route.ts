import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.query(`
    SELECT p.*, s.name AS supplier_name,
      CASE WHEN p.quantity_on_hand <= p.reorder_point THEN true ELSE false END AS low_stock
    FROM parts p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    ORDER BY p.category, p.name
  `);

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["admin", "engineer"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { sku, name, description, category, unit, quantity_on_hand, reorder_point, unit_cost, supplier_id } = body;

  const result = await db.query(
    `INSERT INTO parts (sku, name, description, category, unit, quantity_on_hand, reorder_point, unit_cost, supplier_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [sku, name, description, category, unit ?? "ea", quantity_on_hand ?? 0, reorder_point ?? 5, unit_cost, supplier_id]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
