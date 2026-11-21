"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import StatCard from "@/components/StatCard";
import Toast from "@/components/Toast";
import { Callout, Card, fmt, inputCls, parseNum, tbodyRow, td, th, theadRow } from "@/components/ui";
import { DEMO_TODAY } from "@/lib/dummy-data";
import { formatDate } from "@/lib/format";
import { stockBalance, type StockEntry } from "@/lib/po-data";
import { usePoStore } from "@/lib/po-store";

const TABS = [
  { key: "barang_jadi", label: "Barang Jadi", unit: "pcs", satuan: "PCS" },
  { key: "bahan", label: "Bahan (Sisa Kain)", unit: "kg", satuan: "KG" },
] as const;

type Draft = { arah: StockEntry["arah"]; nama: string; warna: string; size: string | null; max: number | null };

export default function StokPage() {
  const { stock, addStock } = usePoStore();
  const [tab, setTab] = useState<StockEntry["jenis"]>("barang_jadi");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const t = TABS.find((x) => x.key === tab)!;

  const match = (s: string) => s.toLowerCase().includes(q.trim().toLowerCase());
  const balance = stockBalance(stock, tab).filter((r) => match(`${r.nama} ${r.warna} ${r.size ?? ""}`));
  const ledger = stock
    .filter((e) => e.jenis === tab && match(`${e.nama} ${e.warna} ${e.size ?? ""} ${e.sumber} ${e.keterangan}`))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const jadi = stockBalance(stock, "barang_jadi");
  const bahan = stockBalance(stock, "bahan");
  const totalJadi = jadi.reduce((a, r) => a + r.qty, 0);
  const totalBahan = bahan.reduce((a, r) => a + r.qty, 0);
  const masukBulanIni = stock.filter((e) => e.arah === "masuk" && e.tanggal.startsWith(DEMO_TODAY.slice(0, 7))).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0b0b0b]">Stok</h2>
        <p className="mt-1 max-w-3xl text-sm text-[#52514e]">
          Stok barang jadi berasal dari barang lost kategori <b>stok</b> (mulai tahap Sewing). Stok bahan berasal dari sisa
          kain setelah <b>Cutting</b>. Keduanya tercatat otomatis dari halaman tahap, dan bisa dikeluarkan atau ditambah manual.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Barang jadi" value={`${fmt(totalJadi)} pcs`} hint={`${jadi.filter((r) => r.qty > 0).length} SKU tersedia`} accent="blue" />
        <StatCard label="Sisa kain" value={`${fmt(totalBahan)} kg`} hint={`${bahan.filter((r) => r.qty > 0).length} jenis bahan/warna`} accent="violet" />
        <StatCard label="Mutasi masuk bulan ini" value={String(masukBulanIni)} hint="Dari PO & input manual" accent="good" />
        <StatCard label="Total mutasi" value={String(stock.length)} hint="Riwayat masuk & keluar" accent="orange" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-[#e1e0d9] bg-white p-1">
          {TABS.map((x) => (
            <button
              key={x.key}
              onClick={() => setTab(x.key)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${tab === x.key ? "bg-[#2a78d6] text-white" : "text-[#52514e] hover:bg-[#f4f3f0]"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, warna, PO…" className={inputCls + " w-56 py-2"} />
          <button
            onClick={() => setDraft({ arah: "masuk", nama: "", warna: "", size: tab === "barang_jadi" ? "" : null, max: null })}
            className="shrink-0 rounded-lg bg-[#2a78d6] px-4 py-2 text-sm font-medium text-white hover:bg-[#1f5aa8]"
          >
            + Stok masuk manual
          </button>
        </div>
      </div>

      <Card flush title={`Saldo ${t.label.toLowerCase()}`} hint="Saldo = total masuk − total keluar.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className={theadRow}>
                <th className={th}>{tab === "bahan" ? "Bahan" : "Artikel"}</th>
                <th className={th}>Warna</th>
                {tab === "barang_jadi" && <th className={th}>Size</th>}
                <th className={`${th} text-right`}>Saldo</th>
                <th className={th}>Sumber</th>
                <th className={th}>Mutasi terakhir</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {balance.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-[#898781]">Tidak ada stok.</td></tr>
              )}
              {balance.map((r) => (
                <tr key={`${r.nama}|${r.warna}|${r.size}`} className={tbodyRow}>
                  <td className={`${td} font-medium text-[#0b0b0b]`}>{r.nama}</td>
                  <td className={`${td} text-[#52514e]`}>{r.warna}</td>
                  {tab === "barang_jadi" && <td className={td}>{r.size}</td>}
                  <td className={`${td} text-right font-semibold tabular-nums ${r.qty <= 0 ? "text-[#898781]" : "text-[#0b0b0b]"}`}>
                    {fmt(r.qty)} {t.unit}
                  </td>
                  <td className={`${td} text-xs text-[#52514e]`}>{[...r.sumber].join(", ")}</td>
                  <td className={`${td} text-[#52514e]`}>{formatDate(r.last)}</td>
                  <td className={`${td} text-right`}>
                    <button
                      disabled={r.qty <= 0}
                      onClick={() => setDraft({ arah: "keluar", nama: r.nama, warna: r.warna, size: r.size, max: r.qty })}
                      className="rounded-lg border border-[#e1e0d9] px-3 py-1.5 text-xs font-medium text-[#a8481f] hover:bg-[#fbe9e0] disabled:opacity-40"
                    >
                      Keluarkan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card flush title="Riwayat mutasi">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className={theadRow}>
                <th className={th}>Tanggal</th>
                <th className={th}>Item</th>
                <th className={th}>Arah</th>
                <th className={`${th} text-right`}>Qty</th>
                <th className={th}>Sumber / tujuan</th>
                <th className={th}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((e) => (
                <tr key={e.id} className={`${tbodyRow} align-top`}>
                  <td className={`${td} text-[#52514e]`}>{formatDate(e.tanggal)}</td>
                  <td className={td}>
                    {e.nama} · {e.warna}
                    {e.size ? ` · ${e.size}` : ""}
                  </td>
                  <td className={td}><Badge tone={e.arah === "masuk" ? "good" : "warning"}>{e.arah === "masuk" ? "Masuk" : "Keluar"}</Badge></td>
                  <td className={`${td} text-right tabular-nums`}>
                    {e.arah === "masuk" ? "+" : "−"}{fmt(e.qty)} {e.satuan.toLowerCase()}
                  </td>
                  <td className={`${td} text-[#52514e]`}>{e.sumber}</td>
                  <td className={`${td} text-[#52514e]`}>{e.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Callout tone="warning">
        <b>Catatan:</b> pemakaian stok bahan untuk PO baru (mengurangi kebutuhan Order Kain) dan harga pokok stok belum
        dimodelkan — perlu konfirmasi alur ke customer.
      </Callout>

      {draft && (
        <StockModal
          draft={draft}
          jenis={tab}
          satuan={t.satuan}
          unit={t.unit}
          onClose={() => setDraft(null)}
          onSave={(entry) => {
            addStock(entry);
            setDraft(null);
            setToast(`Stok ${entry.arah === "masuk" ? "masuk" : "keluar"}: ${entry.nama} ${entry.warna} ${fmt(entry.qty)} ${t.unit}.`);
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}

function StockModal({
  draft, jenis, satuan, unit, onClose, onSave,
}: {
  draft: Draft;
  jenis: StockEntry["jenis"];
  satuan: StockEntry["satuan"];
  unit: string;
  onClose: () => void;
  onSave: (e: Omit<StockEntry, "id">) => void;
}) {
  const [nama, setNama] = useState(draft.nama);
  const [warna, setWarna] = useState(draft.warna);
  const [size, setSize] = useState(draft.size ?? "");
  const [qty, setQty] = useState("");
  const [sumber, setSumber] = useState(draft.arah === "keluar" ? "" : "Manual");
  const [ket, setKet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const keluar = draft.arah === "keluar";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseNum(qty);
    if (!nama.trim() || !warna.trim() || (jenis === "barang_jadi" && !size.trim())) return setError("Lengkapi nama, warna, dan size.");
    if (!n) return setError("Isi qty.");
    if (draft.max != null && n > draft.max) return setError(`Maksimal ${fmt(draft.max)} ${unit}.`);
    if (!sumber.trim() || !ket.trim()) return setError(keluar ? "Isi tujuan dan keterangan." : "Isi sumber dan keterangan.");
    onSave({
      tanggal: DEMO_TODAY, jenis, nama: nama.trim(), warna: warna.trim(), size: jenis === "barang_jadi" ? size.trim() : null,
      qty: n, satuan, arah: draft.arah, sumber: sumber.trim(), keterangan: ket.trim(),
    });
  }

  return (
    <Modal open onClose={onClose} title={keluar ? "Keluarkan stok" : "Stok masuk manual"}>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Field label={jenis === "bahan" ? "Bahan" : "Artikel"}>
            <input disabled={keluar} value={nama} onChange={(e) => setNama(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Warna">
            <input disabled={keluar} value={warna} onChange={(e) => setWarna(e.target.value)} className={inputCls} />
          </Field>
          {jenis === "barang_jadi" && (
            <Field label="Size">
              <input disabled={keluar} value={size} onChange={(e) => setSize(e.target.value)} className={inputCls} />
            </Field>
          )}
          <Field label={`Qty (${unit})${draft.max != null ? ` — maks ${fmt(draft.max)}` : ""}`}>
            <input type="number" min={0} step="any" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label={keluar ? "Tujuan (mis. Penjualan eceran, PO/09/2026/0010)" : "Sumber (mis. Manual, retur supplier)"}>
          <input value={sumber} onChange={(e) => setSumber(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Keterangan">
          <input value={ket} onChange={(e) => setKet(e.target.value)} placeholder={keluar ? "Dijual ke reseller" : "Retur kain dari supplier"} className={inputCls} />
        </Field>
        {error && <p className="text-xs text-[#a82f2f]">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 font-medium text-[#52514e] hover:bg-[#f4f3f0]">Batal</button>
          <button type="submit" className="rounded-lg bg-[#2a78d6] px-4 py-2 font-medium text-white hover:bg-[#1f5aa8]">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[#52514e]">{label}</span>
      {children}
    </label>
  );
}
