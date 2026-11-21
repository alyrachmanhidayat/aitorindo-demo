"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Callout, Card, inputCls, tbodyRow, td, th, theadRow } from "@/components/ui";
import { DEMO_TODAY } from "@/lib/dummy-data";
import { formatDate, formatNumber } from "@/lib/format";
import {
  allVariants,
  keluarQty,
  lossFor,
  masukQty,
  vKey,
  type ColorVariant,
  type LossRecord,
  type LossStage,
  type Po,
  type PoItem,
} from "@/lib/po-data";
import { usePoStore } from "@/lib/po-store";

export const KATEGORI = [
  { key: "stok", label: "Stok", tone: "info", desc: "Barang bagus yang tidak ikut dikirim — masuk Stok Barang Jadi." },
  { key: "reject", label: "Reject", tone: "critical", desc: "Rusak / cacat, tidak bisa dijual. Wajib alasan & PIC." },
  { key: "hilang", label: "Hilang", tone: "warning", desc: "Tidak ada barangnya / selisih hitung. Wajib alasan & PIC." },
] as const;

type Target = { item: PoItem; variant: ColorVariant; size: string; sisa: number; vendor: string };

/**
 * Hand-over table for Sewing, Finishing and Pengiriman: pieces in (from the previous stage) vs pieces out.
 * Every missing piece must be categorised as stok, reject or hilang; reject & hilang need a reason and a PIC for audit.
 */
export default function HandoverStage({ po, stage, outLabel }: { po: Po; stage: LossStage; outLabel: string }) {
  const { losses, updatePo, removeLoss } = usePoStore();
  const [target, setTarget] = useState<Target | null>(null);
  const vendorStage = stage === "pengiriman" ? null : stage;
  const records = lossFor(losses, po.id, stage);

  const setOut = (variantId: string, size: string, value: number | null) =>
    updatePo(po.id, (p) => {
      const cur = { ...(p.hasil[stage] ?? {}) };
      const row = { ...(cur[variantId] ?? {}) };
      if (value == null) delete row[size];
      else row[size] = value;
      cur[variantId] = row;
      return { ...p, hasil: { ...p.hasil, [stage]: cur } };
    });

  const fillAll = () =>
    updatePo(po.id, (p) => {
      const cur = { ...(p.hasil[stage] ?? {}) };
      for (const { variant } of allVariants(p)) {
        const row = { ...(cur[variant.id] ?? {}) };
        for (const s of variant.sizes) if (row[s.size] == null) row[s.size] = masukQty(p, stage, variant.id, s.size);
        cur[variant.id] = row;
      }
      return { ...p, hasil: { ...p.hasil, [stage]: cur } };
    });

  let totIn = 0;
  let totOut = 0;
  for (const { variant } of allVariants(po))
    for (const s of variant.sizes) {
      totIn += masukQty(po, stage, variant.id, s.size);
      totOut += keluarQty(po, stage, variant.id, s.size) ?? 0;
    }
  const byKat = (k: LossRecord["kategori"]) => records.filter((r) => r.kategori === k).reduce((a, r) => a + r.qty, 0);

  return (
    <>
      <Callout tone="warning">
        <b>Aturan lost:</b> mulai Sewing, setiap selisih antara barang masuk dan keluar wajib dikategorikan menjadi{" "}
        <b>stok</b>, <b>reject</b>, atau <b>hilang</b>. Reject & hilang wajib diisi alasan dan PIC yang bertanggung jawab
        (untuk audit). Tahap tidak bisa diselesaikan sebelum semua selisih tercatat.
      </Callout>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Mini label="Masuk" value={`${formatNumber(totIn)} pcs`} />
        <Mini label={outLabel} value={`${formatNumber(totOut)} pcs`} />
        <Mini label="Stok" value={`${byKat("stok")} pcs`} tone="info" />
        <Mini label="Reject" value={`${byKat("reject")} pcs`} tone="critical" />
        <Mini label="Hilang" value={`${byKat("hilang")} pcs`} tone="warning" />
      </div>

      {allVariants(po).map(({ item, variant }) => (
        <Card
          key={variant.id}
          flush
          title={`${variant.warna} — ${item.artikel}`}
          hint={`${variant.bahan}`}
          right={
            <button
              onClick={fillAll}
              className="rounded-lg border border-[#e1e0d9] px-3 py-1.5 text-xs font-medium text-[#1f5aa8] hover:bg-[#e9f1fc]"
            >
              Isi kosong = qty masuk
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm tabular-nums">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Size</th>
                  {vendorStage && <th className={th}>Vendor</th>}
                  <th className={`${th} text-right`}>Masuk</th>
                  <th className={`${th} text-right`}>{outLabel}</th>
                  <th className={`${th} text-right`}>Selisih</th>
                  <th className={th}>Dikategorikan</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {variant.sizes.map((s) => {
                  const masuk = masukQty(po, stage, variant.id, s.size);
                  const out = keluarQty(po, stage, variant.id, s.size);
                  const selisih = out == null ? null : masuk - out;
                  const recs = lossFor(losses, po.id, stage, variant.id, s.size);
                  const tercatat = recs.reduce((a, r) => a + r.qty, 0);
                  const sisa = selisih == null ? 0 : selisih - tercatat;
                  const vendor = vendorStage ? po.vendor[vendorStage]?.[vKey(variant.id, s.size)] ?? "" : "";
                  return (
                    <tr key={s.size} className={tbodyRow}>
                      <td className={`${td} font-semibold`}>{s.size}</td>
                      {vendorStage && <td className={`${td} text-xs text-[#52514e]`}>{vendor || "—"}</td>}
                      <td className={`${td} text-right`}>{masuk}</td>
                      <td className={`${td} text-right`}>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={masuk}
                          value={out ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const n = raw === "" ? null : Math.max(0, Math.min(masuk, Math.floor(Number(raw))));
                            setOut(variant.id, s.size, Number.isFinite(n as number) ? n : null);
                          }}
                          className={`${inputCls} ml-auto w-24 text-right ${out == null ? "border-[#fab219]" : ""}`}
                        />
                      </td>
                      <td className={`${td} text-right font-semibold ${selisih ? "text-[#a82f2f]" : "text-[#52514e]"}`}>
                        {selisih == null ? "—" : selisih}
                      </td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-1">
                          {recs.map((r) => {
                            const k = KATEGORI.find((x) => x.key === r.kategori)!;
                            return <Badge key={r.id} tone={k.tone}>{k.label} {r.qty}</Badge>;
                          })}
                          {selisih === 0 && <span className="text-xs text-[#0a8a0a]">Pas ✓</span>}
                          {sisa < 0 && <span className="text-xs text-[#a82f2f]">Tercatat melebihi selisih</span>}
                        </div>
                      </td>
                      <td className={`${td} text-right`}>
                        {sisa > 0 && (
                          <button
                            onClick={() => setTarget({ item, variant, size: s.size, sisa, vendor })}
                            className="rounded-lg bg-[#fdecec] px-3 py-1.5 text-xs font-medium text-[#a82f2f] hover:bg-[#f9dcdc]"
                          >
                            Kategorikan {sisa} pcs
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <Card flush title="Catatan lost di tahap ini" hint="Dipakai juga di Laporan → Rekap Reject & Hilang.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className={theadRow}>
                <th className={th}>Tanggal</th>
                <th className={th}>SKU</th>
                <th className={`${th} text-right`}>Qty</th>
                <th className={th}>Kategori</th>
                <th className={th}>Alasan</th>
                <th className={th}>PIC</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-5 text-center text-xs text-[#898781]">Belum ada barang lost di tahap ini.</td>
                </tr>
              )}
              {records.map((r) => {
                const k = KATEGORI.find((x) => x.key === r.kategori)!;
                return (
                  <tr key={r.id} className={`${tbodyRow} align-top`}>
                    <td className={`${td} text-[#52514e]`}>{formatDate(r.tanggal)}</td>
                    <td className={td}>{r.warna} · {r.size}</td>
                    <td className={`${td} text-right tabular-nums`}>{r.qty}</td>
                    <td className={td}><Badge tone={k.tone}>{k.label}</Badge></td>
                    <td className={`${td} text-[#52514e]`}>{r.alasan || "—"}</td>
                    <td className={`${td} text-[#52514e]`}>{r.pic || "—"}</td>
                    <td className={`${td} text-right`}>
                      <button onClick={() => removeLoss(r.id)} className="rounded px-2 py-1 text-xs text-[#a82f2f] hover:bg-[#fdecec]">
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {target && <LossModal po={po} stage={stage} target={target} onClose={() => setTarget(null)} />}
    </>
  );
}

function LossModal({ po, stage, target, onClose }: { po: Po; stage: LossStage; target: Target; onClose: () => void }) {
  const { addLoss } = usePoStore();
  const [kategori, setKategori] = useState<LossRecord["kategori"]>("reject");
  const [qty, setQty] = useState(String(target.sisa));
  const [alasan, setAlasan] = useState("");
  const [pic, setPic] = useState(target.vendor);
  const [error, setError] = useState<string | null>(null);
  const strict = kategori !== "stok";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Math.floor(Number(qty));
    if (!n || n < 1 || n > target.sisa) return setError(`Qty harus 1–${target.sisa}.`);
    if (strict && (!alasan.trim() || !pic.trim())) return setError("Reject & hilang wajib diisi alasan dan PIC.");
    addLoss({
      tanggal: DEMO_TODAY, poId: po.id, variantId: target.variant.id, noPo: po.noPo, namaPo: po.namaPo,
      artikel: target.item.artikel, warna: target.variant.warna, size: target.size, qty: n, hargaJual: target.item.hargaJual,
      tahap: stage, kategori, alasan: alasan.trim(), pic: pic.trim() || (kategori === "stok" ? "Admin Gudang" : ""),
    });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={`Kategorikan lost — ${target.variant.warna} size ${target.size}`}>
      <form onSubmit={submit} className="space-y-4 text-sm">
        <p className="text-[#52514e]">
          {po.namaPo} · {target.item.artikel}. Selisih belum dikategorikan: <b>{target.sisa} pcs</b>.
        </p>
        <div className="grid gap-2">
          {KATEGORI.map((k) => (
            <label
              key={k.key}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                kategori === k.key ? "border-[#2a78d6] bg-[#e9f1fc]" : "border-[#e1e0d9] hover:bg-[#fafaf9]"
              }`}
            >
              <input type="radio" name="kategori" checked={kategori === k.key} onChange={() => setKategori(k.key)} className="mt-1" />
              <span>
                <span className="font-semibold text-[#0b0b0b]">{k.label}</span>
                <span className="block text-xs text-[#52514e]">{k.desc}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="mb-1 block font-medium text-[#52514e]">Qty (pcs)</span>
            <input type="number" min={1} max={target.sisa} value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1 block font-medium text-[#52514e]">PIC {strict && <span className="text-[#a82f2f]">*</span>}</span>
            <input value={pic} onChange={(e) => setPic(e.target.value)} placeholder="Siapa yang bertanggung jawab" className={inputCls} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block font-medium text-[#52514e]">
            Alasan {strict ? <span className="text-[#a82f2f]">*</span> : <span className="font-normal text-[#898781]">(opsional)</span>}
          </span>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={2}
            placeholder={kategori === "stok" ? "mis. lebih potong" : "mis. jahitan miring, noda, selisih hitung saat serah terima"}
            className={inputCls}
          />
        </label>
        {error && <p className="text-xs text-[#a82f2f]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 font-medium text-[#52514e] hover:bg-[#f4f3f0]">Batal</button>
          <button type="submit" className="rounded-lg bg-[#2a78d6] px-4 py-2 font-medium text-white hover:bg-[#1f5aa8]">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "info" | "critical" | "warning" }) {
  const cls = tone === "critical" ? "text-[#a82f2f]" : tone === "warning" ? "text-[#8a5a00]" : tone === "info" ? "text-[#1f5aa8]" : "text-[#0b0b0b]";
  return (
    <div className="rounded-xl border border-[#e1e0d9] bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-[#898781]">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${cls}`}>{value}</p>
    </div>
  );
}
