"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Supplier { id: number; name: string; }
interface Part { id: number; sku: string; name: string; unit_cost: number; }

interface OrderItem {
  part_id: number;
  part_name: string;
  quantity: number;
  unit_cost: number;
}

export default function NewPurchaseOrderForm({
  suppliers,
  parts,
}: {
  suppliers: Supplier[];
  parts: Part[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedPart, setSelectedPart] = useState("");
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addItem() {
    const part = parts.find((p) => p.id === Number(selectedPart));
    if (!part) return;
    if (items.some((i) => i.part_id === part.id)) return;
    setItems([...items, { part_id: part.id, part_name: part.name, quantity: qty, unit_cost: part.unit_cost ?? 0 }]);
    setSelectedPart("");
    setQty(1);
  }

  function removeItem(partId: number) {
    setItems(items.filter((i) => i.part_id !== partId));
  }

  function updateQty(partId: number, newQty: number) {
    setItems(items.map((i) => i.part_id === partId ? { ...i, quantity: newQty } : i));
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId || items.length === 0) {
      setError("Select a supplier and add at least one item.");
      return;
    }
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplier_id: Number(supplierId), items, notes }),
    });

    if (res.ok) {
      setOpen(false);
      setItems([]);
      setSupplierId("");
      setNotes("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create purchase order");
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        + New Purchase Order
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-gray-100">New Purchase Order</h2>
          <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Supplier */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Select supplier…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Add items */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Add Parts</label>
            <div className="flex gap-2">
              <select
                value={selectedPart}
                onChange={(e) => setSelectedPart(e.target.value)}
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="">Select part…</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-20 bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={addItem}
                disabled={!selectedPart}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-lg text-sm text-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Line items */}
          {items.length > 0 && (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-700">
                    <th className="text-left px-3 py-2">Part</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Unit Cost</th>
                    <th className="text-right px-3 py-2">Line Total</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.part_id} className={i < items.length - 1 ? "border-b border-gray-700" : ""}>
                      <td className="px-3 py-2 text-gray-300">{item.part_name}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQty(item.part_id, Number(e.target.value))}
                          className="w-16 bg-gray-700 rounded px-2 py-0.5 text-right text-gray-200 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400">${item.unit_cost.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-gray-200">${(item.quantity * item.unit_cost).toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => removeItem(item.part_id)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-700">
                    <td colSpan={3} className="px-3 py-2 text-right text-xs text-gray-500">Total</td>
                    <td className="px-3 py-2 text-right font-medium text-orange-400">${total.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? "Creating…" : "Create Purchase Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
