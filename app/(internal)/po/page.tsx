"use client";

import Link from "next/link";
import { useState } from "react";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import NewPoForm from "@/components/NewPoForm";
import PoStepper, { stageLabel } from "@/components/PoStepper";
import Toast from "@/components/Toast";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { computePlan } from "@/lib/marker";
import {
  allVariants,
  FEE_RULES,
  keluarQty,
  lineTotal,
  poOrderQty,
  poTotalDp,
  poTotalInvoice,
  poTotalQty,
  stageBlocker,
  stageIndex,
  stageInfo,
  type CostLine,
} from "@/lib/po-data";
import { usePoStore } from "@/lib/po-store";

const yd = (x: number) => x.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function PoPage() {
  const { pos, plans, invoices, losses, selection, select, addPo } = usePoStore();
  const [toast, setToast] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const po = pos.find((p) => p.id === selection.poId) ?? pos[0];
  const stageIdx = stageIndex(po.stage);
  const variants = allVariants(po);

  const rows = variants.map(({ item, variant }) => {
    const plan = plans[variant.id];
    const R = plan ? computePlan(variant.sizes, plan.markers, plan.allowance) : null;
    return { item, variant, plan, R, qty: variant.sizes.reduce((a, s) => a + s.qty, 0) };
  });

  const blocker = po.terkirim ? null : stageBlocker(po, plans, losses);
  const stagePage = stageInfo(po.stage);
  const poLosses = losses.filter((l) => l.poId === po.id);
  const cutDone = stageIdx > stageIndex("cutting") || po.terkirim;
  const hasInvoice = invoices.some((i) => i.poId === po.id);
  const totalDp = poTotalDp(po);

  // Costing
  const materialCost = po.materialCost.reduce((a, l) => a + lineTotal(l), 0);
  const serviceCost = po.serviceCost.reduce((a, l) => a + lineTotal(l), 0);
  const hpp = materialCost + serviceCost;
  const totalInvoice = poTotalInvoice(po);
  const margin = totalInvoice - hpp;
  const marginPct = totalInvoice ? (margin / totalInvoice) * 100 : 0;
  const fees = FEE_RULES.map((fee) => ({ ...fee, amount: Math.round((totalInvoice * fee.percent) / 100) }));
  const profit = margin - fees.reduce((a, x) => a + x.amount, 0);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0b0b0b]">Daftar Purchase Order</h2>
          <p className="text-xs text-[#898781]">Pilih PO untuk melihat item, warna, marker, DP, dan kalkulasinya.</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-lg bg-[#2a78d6] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1f5aa8]"
        >
          + Buat PO Baru
        </button>
      </div>

      {/* ---------- PO list ---------- */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {pos.map((p) => {
          const active = p.id === po.id;
          return (
            <button
              key={p.id}
              onClick={() => select({ poId: p.id, variantId: p.items[0].variants[0].id })}
              className={`rounded-xl border bg-white p-4 text-left shadow-sm transition-colors ${
                active ? "border-[#2a78d6] ring-2 ring-[#2a78d6]/20" : "border-[#e1e0d9] hover:border-[#c9c7bf]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#0b0b0b]">{p.namaPo}</p>
                  <p className="text-xs text-[#898781]">{p.noPo} · {p.brand}</p>
                </div>
                <Badge tone={p.terkirim ? "good" : p.stage === "marker" ? "warning" : "info"}>{stageLabel(p)}</Badge>
              </div>
              <p className="mt-2 text-xs text-[#52514e]">
                {allVariants(p).length} warna · {formatNumber(poTotalQty(p))} pcs · kirim {formatDate(p.tanggalKirim)}
              </p>
              <div className="mt-3">
                <PoStepper po={p} compact />
              </div>
            </button>
          );
        })}
      </div>

      {/* ---------- PO header ---------- */}
      <section className="rounded-xl border border-[#e1e0d9] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[#898781]">{po.noPo} · {po.brand}</p>
            <h2 className="text-xl font-semibold text-[#0b0b0b]">{po.namaPo}</h2>
            <p className="mt-1 text-sm text-[#52514e]">
              Masuk {formatDate(po.tanggalMasuk)} · Kirim {formatDate(po.tanggalKirim)} · {formatNumber(poTotalQty(po))} pcs
            </p>
          </div>
          <div className="text-right">
            {po.terkirim ? (
              <Link
                href="/invoice"
                className="inline-block rounded-lg bg-[#0ca30c] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#0a8a0a]"
              >
                {hasInvoice ? "Terkirim · invoice sudah terbit" : "Terkirim · terbitkan invoice →"}
              </Link>
            ) : (
              <Link
                href={stagePage.href}
                className="inline-block rounded-lg bg-[#2a78d6] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1f5aa8]"
              >
                Buka tahap {stagePage.no}. {stageLabel(po)} →
              </Link>
            )}
            {!po.terkirim && (
              <p className={`mt-1.5 max-w-xs text-xs ${blocker ? "text-[#8a5a00]" : "text-[#0a8a0a]"}`}>
                {blocker ?? "Tahap ini sudah lengkap, siap dilanjutkan."}
              </p>
            )}
          </div>
        </div>
        <div className="mt-5">
          <PoStepper po={po} />
        </div>
        {poTotalQty(po) !== poOrderQty(po) && (
          <p className="mt-4 rounded-lg bg-[#e9f1fc] px-3 py-2 text-xs text-[#1f5aa8]">
            Qty PO mengikuti hasil cutting: order {formatNumber(poOrderQty(po))} pcs → sekarang {formatNumber(poTotalQty(po))} pcs.
          </p>
        )}
      </section>

      {/* ---------- DP & sisa tagihan ---------- */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-[#e1e0d9] bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-[#e1e0d9] px-5 py-3">
            <h3 className="text-sm font-semibold text-[#0b0b0b]">Down payment (DP)</h3>
            <p className="text-xs text-[#898781]">Bertahap, bisa berupa bahan (kain dari customer) atau uang.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <tbody>
                {po.dp.length === 0 && (
                  <tr>
                    <td className="px-5 py-4 text-center text-xs text-[#898781]">Belum ada DP.</td>
                  </tr>
                )}
                {po.dp.map((d, i) => (
                  <tr key={i} className="border-b border-[#eeede9] last:border-0">
                    <td className="px-5 py-2.5 text-[#52514e]">{formatDate(d.tanggal)}</td>
                    <td className="px-5 py-2.5">
                      <Badge tone={d.jenis === "bahan" ? "violet" : "info"}>{d.jenis === "bahan" ? "Bahan" : "Uang"}</Badge>
                    </td>
                    <td className="px-5 py-2.5 text-[#0b0b0b]">{d.keterangan}</td>
                    <td className="px-5 py-2.5 text-right font-medium tabular-nums">{formatRupiah(d.nominal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border border-[#e1e0d9] bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0b0b0b]">Sisa tagihan</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Line label="Total PO" value={formatRupiah(totalInvoice)} />
            <Line label="Total DP" value={`− ${formatRupiah(totalDp)}`} />
            <Line strong label="Sisa tagihan (ke invoice)" value={formatRupiah(totalInvoice - totalDp)} />
          </dl>
        </div>
      </section>

      {/* ---------- Item, warna & marker ---------- */}
      <section className="overflow-hidden rounded-xl border border-[#e1e0d9] bg-white shadow-sm">
        <div className="border-b border-[#e1e0d9] px-5 py-4">
          <h3 className="text-sm font-semibold text-[#0b0b0b]">Item, warna & rencana marker</h3>
          <p className="text-xs text-[#898781]">
            Bahan dibeli & diterima dalam <b>kg</b>. Mulai tahap Marker, kebutuhan dan pemakaian kain dihitung dalam <b>yard</b>.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e1e0d9] text-xs uppercase tracking-wide text-[#898781]">
                <th className="px-5 py-3 font-medium">Artikel / warna</th>
                <th className="px-5 py-3 font-medium">Ukuran</th>
                <th className="px-5 py-3 text-right font-medium">Bahan (kg)</th>
                <th className="px-5 py-3 font-medium">Marker</th>
                <th className="px-5 py-3 text-right font-medium">Rencana (yard)</th>
                <th className="px-5 py-3 text-right font-medium">Pemakaian cutting</th>
                <th className="px-5 py-3 text-right font-medium">Hasil cutting</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, variant, plan, R, qty }) => {
                const final = plan?.status === "final";
                const cut = variant.sizes.map((s) => keluarQty(po, "cutting", variant.id, s.size));
                const cutTotal = cut.every((c) => c != null) ? cut.reduce<number>((a, c) => a + (c ?? 0), 0) : null;
                const sisa = R && plan?.pemakaianAktual != null ? R.totalYard - plan.pemakaianAktual : null;
                return (
                  <tr key={variant.id} className="border-b border-[#eeede9] last:border-0 align-top">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#0b0b0b]">{variant.warna}</p>
                      <p className="text-xs text-[#898781]">{item.artikel} · {variant.bahan} · {variant.lebarKain} cm</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {variant.sizes.map((s) => (
                          <span key={s.size} className="rounded bg-[#f4f3f0] px-1.5 py-0.5 text-[11px] font-medium text-[#52514e]">
                            {s.size}:{s.qty}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#0b0b0b]">{formatNumber(qty)} pcs</p>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-[#52514e]">
                      <p>{variant.kgMasuk != null ? `${variant.kgMasuk} datang` : "—"}</p>
                      <p className="text-xs text-[#898781]">{variant.kgOrder != null ? `order ${variant.kgOrder}` : "belum order"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col items-start gap-1.5">
                        <Badge tone={final ? "good" : plan ? "warning" : "neutral"}>
                          {final ? "Final" : plan ? "Draft" : "Belum dibuat"}
                        </Badge>
                        <Link
                          href="/produksi/marker"
                          onClick={() => select({ poId: po.id, variantId: variant.id })}
                          className="text-xs font-medium text-[#1f5aa8] hover:underline"
                        >
                          {plan ? "Buka marker →" : "Buat marker →"}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      {R ? (
                        <>
                          <p className="font-semibold text-[#0b0b0b]">{yd(R.totalYard)}</p>
                          <p className="text-xs text-[#898781]">
                            {yd(R.yard)} + allow. {yd(R.allowanceYard)} · {R.totalProduced} pcs
                          </p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      {plan?.pemakaianAktual != null ? (
                        <>
                          <p className="font-semibold text-[#0b0b0b]">{yd(plan.pemakaianAktual)} yd</p>
                          {sisa != null && (
                            <p className={`text-xs ${sisa < 0 ? "text-[#a82f2f]" : "text-[#0a8a0a]"}`}>
                              {sisa < 0 ? "boros " : "hemat "}{yd(Math.abs(sisa))} yd
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-[#898781]">{final ? "Diisi di tahap Cutting" : "Butuh marker final"}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      {cutTotal != null ? (
                        <>
                          <p className="font-semibold text-[#0b0b0b]">{formatNumber(cutTotal)} pcs</p>
                          <p className={`text-xs ${cutTotal - qty < 0 ? "text-[#a82f2f]" : "text-[#898781]"}`}>
                            order {formatNumber(qty)}{cutTotal !== qty ? ` (${cutTotal > qty ? "+" : ""}${cutTotal - qty})` : ""}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-[#898781]">{cutDone ? "—" : "Belum cutting"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Barang lost ---------- */}
      <section className="overflow-hidden rounded-xl border border-[#e1e0d9] bg-white shadow-sm">
        <div className="border-b border-[#e1e0d9] px-5 py-3">
          <h3 className="text-sm font-semibold text-[#0b0b0b]">Barang lost (Sewing → Pengiriman)</h3>
          <p className="text-xs text-[#898781]">Dicatat di halaman tahap Sewing, Finishing, dan Pengiriman.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <tbody>
              {poLosses.length === 0 && (
                <tr><td className="px-5 py-4 text-center text-xs text-[#898781]">Belum ada barang lost.</td></tr>
              )}
              {poLosses.map((l) => (
                <tr key={l.id} className="border-b border-[#eeede9] align-top last:border-0">
                  <td className="px-5 py-2.5 text-[#52514e]">{formatDate(l.tanggal)} · <span className="capitalize">{l.tahap}</span></td>
                  <td className="px-5 py-2.5">{l.warna} · {l.size}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{l.qty} pcs</td>
                  <td className="px-5 py-2.5">
                    <Badge tone={l.kategori === "reject" ? "critical" : l.kategori === "hilang" ? "warning" : "info"}>{l.kategori}</Badge>
                  </td>
                  <td className="px-5 py-2.5 text-[#52514e]">{l.alasan || "—"}</td>
                  <td className="px-5 py-2.5 text-[#52514e]">{l.pic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Kalkulasi PO ---------- */}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <CostTable title="Material cost" lines={po.materialCost} total={materialCost} />
          <CostTable title="Service cost" lines={po.serviceCost} total={serviceCost} />
        </div>
        <div className="rounded-xl border border-[#e1e0d9] bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0b0b0b]">Kalkulasi PO</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Line label="Material cost" value={formatRupiah(materialCost)} />
            <Line label="Service cost" value={formatRupiah(serviceCost)} />
            <Line strong label="Total HPP" value={formatRupiah(hpp)} />
            <Line label="Harga jual (total invoice)" value={formatRupiah(totalInvoice)} />
            <Line strong label="Margin" value={`${formatRupiah(margin)} · ${marginPct.toFixed(1)}%`} tone={margin < 0 ? "bad" : "good"} />
            {fees.map((fee) => (
              <Line key={fee.key} label={`${fee.label} (${fee.percent}% dari harga jual)`} value={`− ${formatRupiah(fee.amount)}`} />
            ))}
            <Line strong label="Profit setelah fee" value={formatRupiah(profit)} tone={profit < 0 ? "bad" : "good"} />
          </dl>
          <p className="mt-4 rounded-lg bg-[#fef3dc] px-3 py-2 text-[11px] leading-snug text-[#8a5a00]">
            <b>Catatan:</b> persentase fee dan dasar perhitungannya (harga jual atau margin) masih angka contoh — perlu
            divalidasi ke customer sebelum dipakai.
          </p>
        </div>
      </section>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Buat PO Baru" wide>
        <NewPoForm
          onCancel={() => setFormOpen(false)}
          onSubmit={(data) => {
            const created = addPo(data);
            setFormOpen(false);
            showToast(`${created.noPo} (${created.namaPo}) dibuat — tahap Order Kain.`);
          }}
        />
      </Modal>

      {toast && <Toast message={toast} />}
    </div>
  );
}

function CostTable({ title, lines, total }: { title: string; lines: CostLine[]; total: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e1e0d9] bg-white shadow-sm">
      <div className="border-b border-[#e1e0d9] px-5 py-3">
        <h3 className="text-sm font-semibold text-[#0b0b0b]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm tabular-nums">
          <thead>
            <tr className="border-b border-[#e1e0d9] text-xs uppercase tracking-wide text-[#898781]">
              <th className="px-5 py-2.5 text-left font-medium">Tanggal</th>
              <th className="px-5 py-2.5 text-left font-medium">Unit</th>
              <th className="px-5 py-2.5 text-right font-medium">Qty</th>
              <th className="px-5 py-2.5 text-right font-medium">Harga</th>
              <th className="px-5 py-2.5 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-4 text-center text-xs text-[#898781]">Belum ada transaksi.</td>
              </tr>
            )}
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-[#eeede9] last:border-0">
                <td className="px-5 py-2.5 text-[#52514e]">{formatDate(l.tanggal)}</td>
                <td className="px-5 py-2.5 text-[#0b0b0b]">{l.unit}</td>
                <td className="px-5 py-2.5 text-right">{formatNumber(l.qty)} {l.satuan}</td>
                <td className="px-5 py-2.5 text-right">{formatRupiah(l.harga)}</td>
                <td className="px-5 py-2.5 text-right font-medium">{formatRupiah(lineTotal(l))}</td>
              </tr>
            ))}
          </tbody>
          {lines.length > 0 && (
            <tfoot>
              <tr className="bg-[#fafaf9]">
                <td colSpan={4} className="px-5 py-2.5 text-right text-xs font-medium uppercase text-[#898781]">Total</td>
                <td className="px-5 py-2.5 text-right font-semibold">{formatRupiah(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "good" | "bad" }) {
  const toneCls = tone === "good" ? "text-[#0a8a0a]" : tone === "bad" ? "text-[#a82f2f]" : "text-[#0b0b0b]";
  return (
    <div className={`flex justify-between gap-3 ${strong ? "border-t border-[#eeede9] pt-2 font-semibold" : ""}`}>
      <dt className={strong ? "text-[#0b0b0b]" : "text-[#52514e]"}>{label}</dt>
      <dd className={`text-right tabular-nums ${toneCls}`}>{value}</dd>
    </div>
  );
}
