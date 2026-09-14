"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/classes", label: "Classes & Subjects" },
  { href: "/dashboard/students", label: "Students" },
  { href: "/dashboard/marks", label: "Marks Entry" },
  { href: "/dashboard/results", label: "Results" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 shrink-0 border-r border-hairline bg-paper-raised min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-hairline">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border-2 border-ledger-green text-ledger-green font-serif font-semibold text-sm flex items-center justify-center">
            R
          </div>
          <span className="font-serif text-lg font-semibold text-ink">Register</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-ledger-green-soft text-ledger-green font-medium"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-hairline">
        <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
        <p className="text-xs text-muted capitalize mb-3">{user?.role}</p>
        <button
          onClick={logout}
          className="text-xs text-pen-red hover:underline"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}