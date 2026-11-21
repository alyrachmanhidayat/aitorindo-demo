"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRODUCTION_STAGES } from "@/lib/po-data";
import { usePoStore } from "@/lib/po-store";
import { BoxIcon, ChartIcon, ClipboardIcon, GridIcon, LayersIcon, ReceiptIcon, WalletIcon } from "./icons";

const topItems = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/po", label: "Purchase Order", icon: BoxIcon },
  { href: "/produksi", label: "Papan Produksi", icon: ClipboardIcon },
];

const bottomItems = [
  { href: "/stok", label: "Stok", icon: LayersIcon },
  { href: "/invoice", label: "Invoice", icon: ReceiptIcon },
  { href: "/piutang", label: "Piutang", icon: WalletIcon },
  { href: "/reports", label: "Laporan", icon: ChartIcon },
];

const linkCls = (active: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active ? "bg-[#e9f1fc] text-[#1f5aa8]" : "text-[#52514e] hover:bg-[#f4f3f0] hover:text-[#0b0b0b]"
  }`;

export default function Sidebar() {
  const pathname = usePathname();
  const { pos } = usePoStore();


  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-[#e1e0d9] bg-white md:flex print:hidden">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[#e1e0d9] px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2a78d6] text-xs font-bold text-white">
          AJP
        </div>
        <div className="min-w-0">
          <p className="font-poppins text-[15px] font-bold leading-tight text-[#0b0b0b]">Aitorindo Jaya Perkasa</p>
          <p className="text-[10px] leading-tight text-[#898781]">created by Arah Creative</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {topItems.map((item) => <NavLink key={item.href} item={item} active={pathname === item.href} />)}

        <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-[#898781]">Tahap produksi</p>
        {PRODUCTION_STAGES.map((s) => {
          const active = pathname === s.href;
          const n = pos.filter((p) => p.stage === s.key && !p.terkirim).length;
          return (
            <Link key={s.key} href={s.href} className={`${linkCls(active)} py-1.5`}>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  active ? "bg-[#2a78d6] text-white" : "bg-[#f4f3f0] text-[#52514e]"
                }`}
              >
                {s.no}
              </span>
              <span className="flex-1">{s.label}</span>
              {n > 0 && <span className="rounded-full bg-[#f4f3f0] px-2 text-[11px] font-medium text-[#52514e]">{n}</span>}
            </Link>
          );
        })}

        <div className="pt-4" />
        {bottomItems.map((item) => <NavLink key={item.href} item={item} active={pathname === item.href} />)}
      </nav>

      <div className="shrink-0 border-t border-[#e1e0d9] p-4">
        <p className="rounded-lg bg-[#fef3dc] px-3 py-2 text-[11px] leading-snug text-[#8a5a00]">
          Mode Demo &mdash; seluruh data di bawah ini contoh, bukan data transaksi nyata.
        </p>
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: (typeof topItems)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={linkCls(active)}>
      <Icon className={`h-5 w-5 ${active ? "text-[#2a78d6]" : "text-[#898781]"}`} />
      {item.label}
    </Link>
  );
}
