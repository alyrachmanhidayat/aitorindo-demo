"use client";

import { useState } from "react";
import { Card, inputCls } from "@/components/ui";
import { allVariants, effectiveSizes, vKey, type Po, type VendorStage } from "@/lib/po-data";
import { usePoStore } from "@/lib/po-store";

const SUGGESTED: Record<VendorStage, string[]> = {
  sablon: ["Sablon Mitra — Pak Ujang", "Sablon Digital Jaya — Rudi", "Bordir Komputer Sinar — Eka"],
  sewing: ["Vendor Sewing A — Bu Sri", "Vendor Sewing B — Pak Darto", "Vendor Sewing C — Mang Oji"],
  finishing: ["Finishing In-house — Asep", "Finishing Mitra — Yayan"],
};

/** Assign vendor per colour & size. One stage may be split across several vendors (e.g. size M at vendor A, L at vendor B). */
export default function VendorAssign({ po, stage, title, locked }: { po: Po; stage: VendorStage; title: string; locked?: boolean }) {
  const { pos, updatePo } = usePoStore();
  const [bulk, setBulk] = useState<Record<string, string>>({});
  const map = po.vendor[stage] ?? {};

  const known = Array.from(
    new Set([...SUGGESTED[stage], ...pos.flatMap((p) => Object.values(p.vendor[stage] ?? {}))].filter(Boolean))
  );
  const listId = `vendors-${stage}`;

  const setVendor = (entries: Record<string, string>) =>
    updatePo(po.id, (p) => ({ ...p, vendor: { ...p.vendor, [stage]: { ...(p.vendor[stage] ?? {}), ...entries } } }));

  const summary = new Map<string, number>();
  for (const { variant } of allVariants(po))
    for (const s of effectiveSizes(po, variant)) {
      const name = map[vKey(variant.id, s.size)];
      if (name) summary.set(name, (summary.get(name) ?? 0) + s.qty);
    }

  return (
    <Card
      title={title}
      hint="Satu tahap boleh dibagi ke beberapa vendor — tentukan per warna & size. Ketik nama baru atau pilih dari daftar."
    >
      <datalist id={listId}>
        {known.map((k) => <option key={k} value={k} />)}
      </datalist>
      <div className="space-y-5">
        {allVariants(po).map(({ item, variant }) => {
          const sizes = effectiveSizes(po, variant);
          return (
            <div key={variant.id} className="rounded-lg bg-[#fafaf9] p-4 ring-1 ring-inset ring-[#eeede9]">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#0b0b0b]">{variant.warna}</p>
                  <p className="text-xs text-[#898781]">{item.artikel} · {sizes.reduce((a, s) => a + s.qty, 0)} pcs</p>
                </div>
                {!locked && (
                  <div className="flex items-center gap-2">
                    <input
                      list={listId}
                      value={bulk[variant.id] ?? ""}
                      onChange={(e) => setBulk({ ...bulk, [variant.id]: e.target.value })}
                      placeholder="Vendor untuk semua size"
                      className={inputCls + " w-60"}
                    />
                    <button
                      type="button"
                      disabled={!bulk[variant.id]?.trim()}
                      onClick={() =>
                        setVendor(Object.fromEntries(sizes.map((s) => [vKey(variant.id, s.size), bulk[variant.id].trim()])))
                      }
                      className="rounded-lg border border-[#e1e0d9] bg-white px-3 py-1.5 text-xs font-medium text-[#1f5aa8] hover:bg-[#e9f1fc] disabled:opacity-50"
                    >
                      Isi semua size
                    </button>
                  </div>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sizes.map((s) => {
                  const k = vKey(variant.id, s.size);
                  return (
                    <label key={s.size} className="block text-xs">
                      <span className="mb-1 flex justify-between text-[#52514e]">
                        <span className="font-semibold">Size {s.size}</span>
                        <span className="tabular-nums">{s.qty} pcs</span>
                      </span>
                      <input
                        list={listId}
                        disabled={locked}
                        value={map[k] ?? ""}
                        onChange={(e) => setVendor({ [k]: e.target.value })}
                        placeholder="Nama vendor"
                        className={`${inputCls} ${!map[k]?.trim() && !locked ? "border-[#fab219]" : ""}`}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {summary.size > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="py-1 text-[#898781]">Pembagian:</span>
          {[...summary.entries()].map(([name, qty]) => (
            <span key={name} className="rounded-full bg-[#eeecfa] px-2.5 py-1 font-medium text-[#4a3aa7]">
              {name} · {qty} pcs
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
