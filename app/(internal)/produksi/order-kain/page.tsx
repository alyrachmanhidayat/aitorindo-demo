"use client";

import StageShell from "@/components/StageShell";
import { Callout, Card, inputCls, parseNum, tbodyRow, td, th, theadRow } from "@/components/ui";
import { formatNumber, formatRupiah } from "@/lib/format";
import { allVariants, patchVariant, type Po } from "@/lib/po-data";
import { usePoStore } from "@/lib/po-store";

export default function OrderKainPage() {
  return (
    <StageShell
      stage="order_kain"
      intro="Pesan kain ke supplier untuk setiap warna. Kain dibeli dalam satuan KG."
    >
      {(po) => <OrderKain po={po} />}
    </StageShell>
  );
}

function OrderKain({ po }: { po: Po }) {
  const { updatePo } = usePoStore();
  const rows = allVariants(po);
  const totalKg = rows.reduce((a, { variant }) => a + (variant.kgOrder ?? 0), 0);
  const totalNilai = rows.reduce((a, { variant }) => a + (variant.kgOrder ?? 0) * (variant.hargaKg ?? 0), 0);

  return (
    <>
      <Card flush title="Order kain per warna" hint="Supplier & kg order wajib diisi. Harga per kg dipakai untuk Material Cost PO.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className={theadRow}>
                <th className={th}>Warna / artikel</th>
                <th className={th}>Bahan</th>
                <th className={`${th} text-right`}>Qty PO</th>
                <th className={th}>Supplier</th>
                <th className={`${th} text-right`}>KG order</th>
                <th className={`${th} text-right`}>Harga / kg</th>
                <th className={`${th} text-right`}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, variant: v }) => (
                <tr key={v.id} className={tbodyRow}>
                  <td className={td}>
                    <p className="font-medium text-[#0b0b0b]">{v.warna}</p>
                    <p className="text-xs text-[#898781]">{item.artikel}</p>
                  </td>
                  <td className={`${td} text-[#52514e]`}>{v.bahan} · {v.lebarKain} cm</td>
                  <td className={`${td} text-right tabular-nums`}>{formatNumber(v.sizes.reduce((a, s) => a + s.qty, 0))} pcs</td>
                  <td className={td}>
                    <input
                      value={v.supplier ?? ""}
                      onChange={(e) => updatePo(po.id, (p) => patchVariant(p, v.id, { supplier: e.target.value }))}
                      placeholder="Nama supplier"
                      list="suppliers"
                      className={`${inputCls} w-48 ${!v.supplier?.trim() ? "border-[#fab219]" : ""}`}
                    />
                  </td>
                  <td className={`${td} text-right`}>
                    <input
                      type="number" min={0} inputMode="decimal"
                      value={v.kgOrder ?? ""}
                      onChange={(e) => updatePo(po.id, (p) => patchVariant(p, v.id, { kgOrder: parseNum(e.target.value) }))}
                      placeholder="kg"
                      className={`${inputCls} ml-auto w-24 text-right ${!v.kgOrder ? "border-[#fab219]" : ""}`}
                    />
                  </td>
                  <td className={`${td} text-right`}>
                    <input
                      type="number" min={0}
                      value={v.hargaKg ?? ""}
                      onChange={(e) => updatePo(po.id, (p) => patchVariant(p, v.id, { hargaKg: parseNum(e.target.value) }))}
                      placeholder="Rp"
                      className={`${inputCls} ml-auto w-32 text-right`}
                    />
                  </td>
                  <td className={`${td} text-right font-medium tabular-nums`}>
                    {v.kgOrder && v.hargaKg ? formatRupiah(v.kgOrder * v.hargaKg) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#fafaf9]">
                <td colSpan={4} className="px-4 py-2.5 text-right text-xs font-medium uppercase text-[#898781]">Total</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatNumber(totalKg)} kg</td>
                <td />
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatRupiah(totalNilai)}</td>
              </tr>
            </tfoot>
          </table>
          <datalist id="suppliers">
            {["PT Kahatex", "CV Sinar Tekstil", "Toko Kain Cigondewah", "Kain dari customer"].map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
      </Card>
      <Callout>
        Saat PO dilanjutkan, order kain otomatis dicatat ke <b>Material Cost</b> PO. Jika kain dari customer (DP bahan),
        isi supplier &quot;Kain dari customer&quot;.
      </Callout>
      <Callout tone="warning">
        <b>Catatan:</b> field tambahan untuk Order Kain (mis. no. nota supplier, tanggal janji datang) belum ditentukan —
        perlu konfirmasi customer.
      </Callout>
    </>
  );
}
