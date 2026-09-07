import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Nav from "@/components/Nav";
import NewPurchaseOrderForm from "@/components/NewPurchaseOrderForm";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-700 text-gray-300",
  pending_approval: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  ordered: "bg-blue-500/20 text-blue-400",
  received: "bg-purple-500/20 text-purple-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default async function PurchaseOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [suppliersResult, partsResult] = await Promise.all([
    db.query("SELECT id, name FROM suppliers ORDER BY name"),
    db.query("SELECT id, sku, name, unit_cost FROM parts ORDER BY category, name"),
  ]);

  const orders = await db.query(`
    SELECT po.*, s.name AS supplier_name,
      u.name AS created_by_name,
      a.name AS approved_by_name,
      COUNT(poi.id)::int AS item_count
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN users u ON po.created_by = u.id
    LEFT JOIN users a ON po.approved_by = a.id
    LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
    GROUP BY po.id, s.name, u.name, a.name
    ORDER BY po.created_at DESC
  `);

  return (
    <div>
      <Nav userName={session.name} role={session.role} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-100">Purchase Orders</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{orders.rows.length} orders</span>
            {(session.role === "admin" || session.role === "engineer") && (
              <NewPurchaseOrderForm
                suppliers={suppliersResult.rows}
                parts={partsResult.rows}
              />
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5">PO Number</th>
                <th className="text-left px-4 py-2.5">Supplier</th>
                <th className="text-left px-4 py-2.5">Created By</th>
                <th className="text-right px-4 py-2.5">Items</th>
                <th className="text-right px-4 py-2.5">Total</th>
                <th className="text-left px-4 py-2.5">Date</th>
                <th className="text-center px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.rows.map((o, i) => (
                <tr key={o.id} className={i < orders.rows.length - 1 ? "border-b border-gray-800/50" : ""}>
                  <td className="px-4 py-3 font-mono text-xs text-orange-400">{o.po_number}</td>
                  <td className="px-4 py-3 text-gray-200">{o.supplier_name}</td>
                  <td className="px-4 py-3 text-gray-400">{o.created_by_name}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{o.item_count}</td>
                  <td className="px-4 py-3 text-right text-gray-200">
                    ${Number(o.total_cost ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[o.status] ?? ""}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-600">No purchase orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
