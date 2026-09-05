"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/purchase-orders", label: "Purchase Orders" },
  { href: "/suppliers", label: "Suppliers" },
];

export default function Nav({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-orange-400 text-lg tracking-tight">UAS Ops</span>
        <div className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname.startsWith(l.href)
                  ? "bg-orange-500/20 text-orange-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-400">{userName}</span>
        <span className="bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">{role}</span>
        <button onClick={logout} className="text-gray-500 hover:text-white transition-colors">
          Logout
        </button>
      </div>
    </nav>
  );
}
