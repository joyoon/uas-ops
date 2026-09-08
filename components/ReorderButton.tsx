"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReorderButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/reorder", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      if (data.created === 0) {
        setResult("No reorder needed — all parts are sufficiently stocked.");
      } else {
        setResult(`Created ${data.created} draft PO(s) for ${data.pos.map((p: { supplier: string }) => p.supplier).join(", ")}.`);
        router.refresh();
      }
    } else {
      setResult(data.error ?? "Reorder check failed.");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={loading}
        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-xs font-medium rounded-lg border border-gray-700 transition-colors"
      >
        {loading ? "Checking…" : "Run Reorder Check"}
      </button>
      {result && <span className="text-xs text-gray-400">{result}</span>}
    </div>
  );
}
