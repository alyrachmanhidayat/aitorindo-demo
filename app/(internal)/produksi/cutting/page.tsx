"use client";

import Link from "next/link";
import Badge from "@/components/Badge";
import StageShell from "@/components/StageShell";
import { Callout, Card, fmt, inputCls, parseNum, tbodyRow, td, th, theadRow } from "@/components/ui";
import { formatNumber, formatRupiah } from "@/lib/format";
import { computePlan } from "@/lib/marker";
import { allVariants, keluarQty, poOrderQty, poTotalInvoice, poTotalQty, type Po } from "@/lib/po-data";
import { usePoStore } from "@/lib/po-store";

export default function CuttingPage() {
  return (
    <StageShell
      stage="cutting"
      intro="Potong kain sesuai marker final. Catat pemakaian kain (yard), hasil potong per size, dan sisa kain."
    >
      {(po) => <Cutting po={po} />}
    </StageShell>
  );
}

function Cutting({ po }: { po: Po }) {
  const { plans, updatePo, setPemakaian, select } = usePoStore();
  const orderQty = poOrderQty(po);
  const cutQty = poTotalQty(po);
  // Value of the PO as ordered, to show how Cutting changes it.
  const orderValue = po.items.reduce((a, it) => a + it.hargaJual * it.variants.reduce((b, v) => b + v.sizes.reduce((c, s) => c + s.qty, 0), 0), 0);

  const setCut = (variantId: string, size: string, value: number | null) =>
    updatePo(po.id, (p) => {
      const cur = { ...(p.hasil.cutting ?? {}) };
      const row = { ...(cur[variantId] ?? {}) };
      if (value == null) delete row[size];
      else row[size] = value;
      cur[variantId] = row;
      return { ...p, hasil: { ...p.hasil, cutting: cur } };
    });

  return (
    <>
      <Callout>
        <b>PO dinamis sampai tahap Cutting:</b> qty & nilai PO mengikuti hasil cutting. Setelah tahap ini, qty PO terkunci —
        selisih di tahap berikutnya dicatat sebagai stok / reject / hilang.
      </Callout>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Qty order" value={`${formatNumber(orderQty)} pcs`} />
        <Stat label="Qty PO sekarang" value={`${formatNumber(cutQty)} pcs`} hint={cutQty !== orderQty ? `${cutQty > orderQty ? "+" : ""}${cutQty - orderQty} dari order` : "sama dengan order"} />
        <Stat label="Nilai order" value={formatRupiah(orderValue)} />
        <Stat label="Nilai PO sekarang" value={formatRupiah(poTotalInvoice(po))} />
      </div>

      {allVariants(po).map(({ item, variant: v }) => {
        const plan = plans[v.id];
        const R = plan ? computePlan(v.sizes, plan.markers, plan.allowance) : null;
        const sisaYard = R && plan?.pemakaianAktual != null ? R.totalYard - plan.pemakaianAktual : null;
        return (
          <Card
            key={v.id}
            title={`${v.warna} — ${item.artikel}`}
            hint={`${v.bahan} · lebar ${v.lebarKain} cm · bahan datang ${v.kgMasuk ?? "—"} kg`}
            right={
              <Link
                href="/produksi/marker"
                onClick={() => select({ poId: po.id, variantId: v.id })}
                className="text-xs font-medium text-[#1f5aa8] hover:underline"
              >
                Lihat marker →
              </Link>
            }
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="overflow-x-auto">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#898781]">Hasil potong per size</p>
                  {R && (
                    <button
                      onClick={() => v.sizes.forEach((s, i) => keluarQty(po, "cutting", v.id, s.size) == null && setCut(v.id, s.size, R.produced[i]))}
                      className="rounded-lg border border-[#e1e0d9] px-3 py-1.5 text-xs font-medium text-[#1f5aa8] hover:bg-[#e9f1fc]"
                    >
                      Isi kosong = rencana marker
                    </button>
                  )}
                </div>
                <table className="w-full min-w-[460px] text-sm tabular-nums">
                  <thead>
                    <tr className={theadRow}>
                      <th className={`${th} text-left`}>Size</th>
                      <th className={`${th} text-right`}>Order</th>
                      <th className={`${th} text-right`}>Rencana marker</th>
                      <th className={`${th} text-right`}>Hasil cutting</th>
                      <th className={`${th} text-right`}>vs order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.sizes.map((s, i) => {
                      const cut = keluarQty(po, "cutting", v.id, s.size);
                      const d = cut == null ? null : cut - s.qty;
                      return (
                        <tr key={s.size} className={tbodyRow}>
                          <td className={`${td} font-semibold`}>{s.size}</td>
                          <td className={`${td} text-right`}>{s.qty}</td>
                          <td className={`${td} text-right text-[#52514e]`}>{R ? R.produced[i] : "—"}</td>
                          <td className={`${td} text-right`}>
                            <input
                              type="number" min={0} inputMode="numeric"
                              value={cut ?? ""}
                              onChange={(e) => {
                                const n = parseNum(e.target.value);
                                setCut(v.id, s.size, n == null ? null : Math.floor(n));
                              }}
                              className={`${inputCls} ml-auto w-24 text-right ${cut == null ? "border-[#fab219]" : ""}`}
                            />
                          </td>
                          <td className={`${td} text-right font-medium ${d == null ? "" : d > 0 ? "text-[#0a8a0a]" : d < 0 ? "text-[#a82f2f]" : "text-[#52514e]"}`}>
                            {d == null ? "—" : `${d > 0 ? "+" : ""}${d}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 rounded-lg bg-[#fafaf9] p-4 ring-1 ring-inset ring-[#eeede9]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#52514e]">Marker</span>
                  <Badge tone={plan?.status === "final" ? "good" : "warning"}>{plan?.status === "final" ? "Final" : "Belum final"}</Badge>
                </div>
                <Row label="Rencana kebutuhan" value={R ? `${fmt(R.totalYard)} yd` : "—"} />
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-[#52514e]">Pemakaian aktual (yard)</span>
                  <input
                    type="number" min={0} inputMode="decimal"
                    value={plan?.pemakaianAktual ?? ""}
                    onChange={(e) => setPemakaian(v.id, parseNum(e.target.value))}
                    className={`${inputCls} ${plan?.pemakaianAktual == null ? "border-[#fab219]" : ""}`}
                  />
                </label>
                <Row
                  label={sisaYard != null && sisaYard < 0 ? "Boros dari rencana" : "Hemat dari rencana"}
                  value={sisaYard == null ? "—" : `${fmt(Math.abs(sisaYard))} yd`}
                  tone={sisaYard == null ? undefined : sisaYard < 0 ? "bad" : "good"}
                />
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-[#52514e]">Sisa kain fisik (kg) → Stok Bahan</span>
                  <input
                    type="number" min={0} inputMode="decimal"
                    value={po.sisaKainKg[v.id] ?? ""}
                    placeholder="opsional"
                    onChange={(e) => updatePo(po.id, (p) => ({ ...p, sisaKainKg: { ...p.sisaKainKg, [v.id]: parseNum(e.target.value) } }))}
                    className={inputCls}
                  />
                </label>
                <p className="text-[11px] leading-snug text-[#898781]">Sisa kain ditimbang lalu masuk Stok Bahan saat PO lanjut ke Antri Sablon.</p>
              </div>
            </div>
          </Card>
        );
      })}
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[#e1e0d9] bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-[#898781]">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-[#0b0b0b]">{value}</p>
      {hint && <p className="text-xs text-[#52514e]">{hint}</p>}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-[#52514e]">{label}</span>
      <span className={`font-semibold tabular-nums ${tone === "good" ? "text-[#0a8a0a]" : tone === "bad" ? "text-[#a82f2f]" : "text-[#0b0b0b]"}`}>{value}</span>
    </div>
  );
}
