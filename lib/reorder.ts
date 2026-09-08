import { db } from "./db";

export interface ReorderResult {
  created: number;
  skipped: number;
  pos: { po_number: string; supplier: string; items: number }[];
}

export async function runReorderCheck(createdBy?: number): Promise<ReorderResult> {
  // Parts below reorder point with no open PO already covering them
  const { rows: lowStock } = await db.query<{
    id: number; name: string; sku: string; supplier_id: number | null;
    supplier_name: string | null; reorder_point: number; quantity_on_hand: number; unit_cost: string;
  }>(`
    SELECT p.id, p.name, p.sku, p.supplier_id, s.name AS supplier_name,
           p.reorder_point, p.quantity_on_hand, p.unit_cost
    FROM parts p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.quantity_on_hand <= p.reorder_point
      AND p.supplier_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM purchase_order_items poi
        JOIN purchase_orders po ON poi.po_id = po.id
        WHERE poi.part_id = p.id
          AND po.status IN ('draft', 'pending_approval', 'approved', 'ordered')
      )
  `);

  if (lowStock.length === 0) return { created: 0, skipped: 0, pos: [] };

  // Group by supplier
  const bySupplier = new Map<number, typeof lowStock>();
  for (const row of lowStock) {
    const sid = row.supplier_id!;
    if (!bySupplier.has(sid)) bySupplier.set(sid, []);
    bySupplier.get(sid)!.push(row);
  }

  const result: ReorderResult = { created: 0, skipped: 0, pos: [] };

  for (const [supplierId, parts] of bySupplier) {
    const poNumber = `PO-AUTO-${Date.now()}-${supplierId}`;
    const totalCost = parts.reduce(
      (sum, p) => sum + Number(p.unit_cost ?? 0) * p.reorder_point * 2,
      0
    );

    const { rows: [po] } = await db.query<{ id: number }>(
      `INSERT INTO purchase_orders (po_number, supplier_id, status, created_by, notes, total_cost)
       VALUES ($1, $2, 'draft', $3, $4, $5) RETURNING id`,
      [
        poNumber,
        supplierId,
        createdBy ?? null,
        "Auto-generated reorder — review before approving",
        totalCost,
      ]
    );

    for (const part of parts) {
      const qty = part.reorder_point * 2;
      await db.query(
        `INSERT INTO purchase_order_items (po_id, part_id, quantity, unit_cost) VALUES ($1, $2, $3, $4)`,
        [po.id, part.id, qty, Number(part.unit_cost ?? 0)]
      );
    }

    result.created++;
    result.pos.push({ po_number: poNumber, supplier: parts[0].supplier_name ?? "", items: parts.length });
  }

  return result;
}
