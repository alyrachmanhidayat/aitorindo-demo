"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRODUCTION_STAGES } from "@/lib/po-data";
import { BellIcon } from "./icons";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/po", label: "PO" },
  { href: "/produksi", label: "Papan" },
  ...PRODUCTION_STAGES.map((s) => ({ href: s.href, label: `${s.no}. ${s.short}` })),
  { href: "/stok", label: "Stok" },
  { href: "/invoice", label: "Invoice" },
  { href: "/piutang", label: "Piutang" },
  { href: "/reports", label: "Laporan" },
];

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/po": "Purchase Order",
  "/produksi": "Produksi",
  ...Object.fromEntries(PRODUCTION_STAGES.map((s) => [s.href, `Produksi · Tahap ${s.no}`])),
  "/stok": "Stok Barang Jadi & Bahan",
  "/invoice": "Penerbitan Invoice",
  "/piutang": "Piutang & Pembayaran",
  "/reports": "Laporan",
};

export default function Topbar() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Dashboard";

  return (
    <header className="z-10 shrink-0 border-b border-[#e1e0d9] bg-white print:hidden">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex items-center gap-2.5 md:hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2a78d6] text-[11px] font-bold text-white">
            AJP
          </div>
          <div className="min-w-0">
            <p className="font-poppins text-sm font-bold leading-tight text-[#0b0b0b]">Aitorindo Jaya Perkasa</p>
            <p className="text-[10px] leading-tight text-[#898781]">created by Arah Creative</p>
          </div>
        </div>
        <h1 className="hidden text-lg font-semibold text-[#0b0b0b] md:block">{title}</h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#52514e] hover:bg-[#f4f3f0]"
            aria-label="Notifikasi"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-[#e1e0d9] py-1 pl-1 pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eeecfa] text-xs font-semibold text-[#4a3aa7]">
              AD
            </div>
            <span className="hidden text-sm font-medium text-[#0b0b0b] sm:inline">Admin</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-[#e1e0d9] px-4 py-2 md:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                active ? "bg-[#e9f1fc] text-[#1f5aa8]" : "text-[#52514e] bg-[#f4f3f0]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
