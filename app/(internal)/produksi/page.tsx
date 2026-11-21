"use client";

import Link from "next/link";
import Badge from "@/components/Badge";
import { DEMO_TODAY, urgencyTone } from "@/lib/dummy-data";
import { daysUntil, formatNumber } from "@/lib/format";
import { poTotalQty, PRODUCTION_STAGES, stageBlocker } from "@/lib/po-data";
import { usePoStore } from "@/lib/po-store";

/** Board of all active POs, one column per production stage. */
export default function ProduksiBoard() {
  const { pos, plans, losses, select } = usePoStore();
  const active = pos.filter((p) => !p.terkirim);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#0b0b0b]">Papan Produksi</h2>
        <p className="mt-1 text-sm text-[#52514e]">
          {active.length} PO aktif dalam 8 tahap. Klik judul kolom untuk membuka halaman tahapnya, atau klik PO untuk langsung
          mengerjakannya.
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {PRODUCTION_STAGES.map((s) => {
          const list = active.filter((p) => p.stage === s.key).sort((a, b) => a.tanggalKirim.localeCompare(b.tanggalKirim));
          return (
            <div key={s.key} className="w-64 shrink-0 rounded-xl bg-[#f4f3f0] p-3">
              <Link href={s.href} className="mb-3 flex items-center justify-between gap-2 rounded-lg px-1 hover:text-[#1f5aa8]">
                <span className="text-sm font-semibold text-[#0b0b0b]">
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] text-[#52514e]">{s.no}</span>
                  {s.label}
                </span>
                <span className="text-xs font-medium text-[#898781]">{list.length}</span>
              </Link>
              <div className="space-y-2">
                {list.length === 0 && <p className="px-1 py-4 text-center text-xs text-[#898781]">Kosong</p>}
                {list.map((p) => {
                  const left = daysUntil(p.tanggalKirim, DEMO_TODAY);
                  const ready = !stageBlocker(p, plans, losses);
                  return (
                    <Link
                      key={p.id}
                      href={s.href}
                      onClick={() => select({ poId: p.id, variantId: p.items[0].variants[0].id })}
                      className="block rounded-lg border border-[#e1e0d9] bg-white p-3 shadow-sm hover:border-[#2a78d6]"
                    >
                      <p className="text-sm font-medium text-[#0b0b0b]">{p.namaPo}</p>
                      <p className="text-[11px] text-[#898781]">{p.noPo} · {formatNumber(poTotalQty(p))} pcs</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge tone={urgencyTone(left)}>H-{left}</Badge>
                        {s.twoPhase && <Badge tone={p.fase === "antri" ? "warning" : "info"}>{p.fase === "antri" ? "Antri" : "Proses"}</Badge>}
                        {ready && <Badge tone="good">Siap lanjut</Badge>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
