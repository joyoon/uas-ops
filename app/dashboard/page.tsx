import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Nav from "@/components/Nav";
import AiAssistant from "@/components/AiAssistant";
import ReorderButton from "@/components/ReorderButton";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [partsResult, ordersResult, suppliersResult, lowStockResult] = await Promise.all([
    db.query("SELECT COUNT(*) FROM parts"),
    db.query("SELECT COUNT(*) FROM purchase_orders WHERE status NOT IN ('received','cancelled')"),
    db.query("SELECT COUNT(*) FROM suppliers"),
    db.query("SELECT COUNT(*) FROM parts WHERE quantity_on_hand <= reorder_point"),
  ]);

  const stats = [
    { label: "Total Parts", value: partsResult.rows[0].count, color: "text-blue-400" },
    { label: "Active Orders", value: ordersResult.rows[0].count, color: "text-green-400" },
    { label: "Suppliers", value: suppliersResult.rows[0].count, color: "text-purple-400" },
    { label: "Low Stock Alerts", value: lowStockResult.rows[0].count, color: "text-red-400" },
  ];

  const recentOrders = await db.query(`
    SELECT po.po_number, po.status, po.total_cost, po.created_at, s.name AS supplier
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    ORDER BY po.created_at DESC LIMIT 5
  `);

  const lowStock = await db.query(`
    SELECT sku, name, quantity_on_hand, reorder_point, category
    FROM parts WHERE quantity_on_hand <= reorder_point ORDER BY quantity_on_hand ASC LIMIT 5
  `);

  return (
    <div>
      <Nav userName={session.name} role={session.role} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-100">Operations Dashboard</h1>
          {(session.role === "admin" || session.role === "engineer") && <ReorderButton />}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Orders */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-medium text-gray-300 mb-3">Recent Purchase Orders</h2>
            <div className="space-y-2">
              {recentOrders.rows.map((o) => (
                <div key={o.po_number} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-200 font-mono text-xs">{o.po_number}</span>
                    <span className="text-gray-500 mx-2">·</span>
                    <span className="text-gray-400">{o.supplier}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">${Number(o.total_cost).toFixed(2)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      o.status === "approved" ? "bg-green-500/20 text-green-400" :
                      o.status === "pending_approval" ? "bg-yellow-500/20 text-yellow-400" :
                      o.status === "draft" ? "bg-gray-700 text-gray-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>{o.status}</span>
                  </div>
                </div>
              ))}
              {recentOrders.rows.length === 0 && (
                <p className="text-gray-600 text-sm">No orders yet</p>
              )}
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-medium text-gray-300 mb-3">Low Stock Alerts</h2>
            <div className="space-y-2">
              {lowStock.rows.map((p) => (
                <div key={p.sku} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-200">{p.name}</span>
                    <span className="text-gray-500 text-xs ml-2">{p.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-red-400 font-medium">{p.quantity_on_hand}</span>
                    <span className="text-gray-600 text-xs"> / {p.reorder_point} min</span>
                  </div>
                </div>
              ))}
              {lowStock.rows.length === 0 && (
                <p className="text-gray-600 text-sm">All parts sufficiently stocked</p>
              )}
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <AiAssistant />
      </main>
    </div>
  );
}
