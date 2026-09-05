import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();

  // Fetch live data to give the AI context
  const [parts, suppliers, orders] = await Promise.all([
    db.query(`
      SELECT sku, name, category, quantity_on_hand, reorder_point, unit_cost,
        CASE WHEN quantity_on_hand <= reorder_point THEN true ELSE false END AS low_stock,
        (SELECT name FROM suppliers WHERE id = parts.supplier_id) AS supplier
      FROM parts ORDER BY category, name
    `),
    db.query(`SELECT name, contact_name, email, lead_time_days FROM suppliers ORDER BY name`),
    db.query(`
      SELECT po_number, status, total_cost, created_at,
        (SELECT name FROM suppliers WHERE id = purchase_orders.supplier_id) AS supplier
      FROM purchase_orders ORDER BY created_at DESC LIMIT 20
    `),
  ]);

  const context = `
You are an operations assistant for a UAS (unmanned aircraft systems) company.
You have access to the following live data from the inventory management system:

## Current Inventory (${parts.rows.length} parts)
${JSON.stringify(parts.rows, null, 2)}

## Suppliers (${suppliers.rows.length} suppliers)
${JSON.stringify(suppliers.rows, null, 2)}

## Recent Purchase Orders (last 20)
${JSON.stringify(orders.rows, null, 2)}

Answer the user's question clearly and concisely. If asked about low stock, highlight parts where quantity_on_hand <= reorder_point.
If asked for recommendations, base them on the actual data above.
`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: context,
    messages: [{ role: "user", content: message }],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return NextResponse.json({ response: text });
}
