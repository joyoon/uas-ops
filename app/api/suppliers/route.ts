import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.query(`
    SELECT s.*, COUNT(p.id) AS part_count
    FROM suppliers s
    LEFT JOIN parts p ON p.supplier_id = s.id
    GROUP BY s.id
    ORDER BY s.name
  `);

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, contact_name, email, phone, lead_time_days, notes } = await req.json();

  const result = await db.query(
    `INSERT INTO suppliers (name, contact_name, email, phone, lead_time_days, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, contact_name, email, phone, lead_time_days, notes]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
