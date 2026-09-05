import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Nav from "@/components/Nav";
import Link from "next/link";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const parts = await db.query(`
    SELECT p.*, s.name AS supplier_name,
      CASE WHEN p.quantity_on_hand <= p.reorder_point THEN true ELSE false END AS low_stock
    FROM parts p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    ORDER BY p.category, p.name
  `);

  const categories = [...new Set(parts.rows.map((p) => p.category))];

  return (
    <div>
      <Nav userName={session.name} role={session.role} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-100">Parts Inventory</h1>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>{parts.rows.length} parts</span>
            <span className="text-red-400">{parts.rows.filter((p) => p.low_stock).length} low stock</span>
          </div>
        </div>

        {categories.map((cat) => {
          const catParts = parts.rows.filter((p) => p.category === cat);
          return (
            <div key={cat} className="mb-6">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">{cat}</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-2.5">SKU</th>
                      <th className="text-left px-4 py-2.5">Name</th>
                      <th className="text-left px-4 py-2.5">Supplier</th>
                      <th className="text-right px-4 py-2.5">On Hand</th>
                      <th className="text-right px-4 py-2.5">Reorder At</th>
                      <th className="text-right px-4 py-2.5">Unit Cost</th>
                      <th className="text-center px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catParts.map((p, i) => (
                      <tr key={p.id} className={`${i < catParts.length - 1 ? "border-b border-gray-800/50" : ""}`}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.sku}</td>
                        <td className="px-4 py-3 text-gray-200">{p.name}</td>
                        <td className="px-4 py-3 text-gray-400">{p.supplier_name ?? "—"}</td>
                        <td className={`px-4 py-3 text-right font-medium ${p.low_stock ? "text-red-400" : "text-gray-200"}`}>
                          {p.quantity_on_hand}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{p.reorder_point}</td>
                        <td className="px-4 py-3 text-right text-gray-300">
                          {p.unit_cost ? `$${Number(p.unit_cost).toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.low_stock ? (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Low Stock</span>
                          ) : (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
