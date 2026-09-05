import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Nav from "@/components/Nav";

export default async function SuppliersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const suppliers = await db.query(`
    SELECT s.*, COUNT(p.id)::int AS part_count
    FROM suppliers s
    LEFT JOIN parts p ON p.supplier_id = s.id
    GROUP BY s.id ORDER BY s.name
  `);

  return (
    <div>
      <Nav userName={session.name} role={session.role} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-100">Suppliers</h1>
          <span className="text-sm text-gray-500">{suppliers.rows.length} suppliers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.rows.map((s) => (
            <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-medium text-gray-100">{s.name}</h2>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                  {s.part_count} parts
                </span>
              </div>
              <div className="space-y-1.5 text-sm">
                {s.contact_name && (
                  <div className="flex gap-2">
                    <span className="text-gray-600 w-16 shrink-0">Contact</span>
                    <span className="text-gray-300">{s.contact_name}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex gap-2">
                    <span className="text-gray-600 w-16 shrink-0">Email</span>
                    <span className="text-gray-400 text-xs">{s.email}</span>
                  </div>
                )}
                {s.phone && (
                  <div className="flex gap-2">
                    <span className="text-gray-600 w-16 shrink-0">Phone</span>
                    <span className="text-gray-400">{s.phone}</span>
                  </div>
                )}
                {s.lead_time_days && (
                  <div className="flex gap-2">
                    <span className="text-gray-600 w-16 shrink-0">Lead time</span>
                    <span className={`font-medium ${s.lead_time_days > 14 ? "text-yellow-400" : "text-green-400"}`}>
                      {s.lead_time_days} days
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
