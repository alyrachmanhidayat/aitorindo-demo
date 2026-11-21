"use client";

import Link from "next/link";
import StageShell from "@/components/StageShell";
import { Callout, Card, fmt, inputCls, parseNum, tbodyRow, td, th, theadRow } from "@/components/ui";
import { allVariants, patchVariant, stockBalance, type Po } from "@/lib/po-data";
import { usePoStore } from "@/lib/po-store";

export default function DatangBahanPage() {
  return (
    <StageShell stage="dateng_bahan" intro="Catat kain yang benar-benar datang per warna (KG). Material cost mengikuti kg yang datang.">
      {(po) => <DatangBahan po={po} />}
    </StageShell>
  );
}

function DatangBahan({ po }: { po: Po }) {
  const { updatePo, stock } = usePoStore();
  const stokBahan = stockBalance(stock, "bahan");

  return (
    <>
      <Card flush title="Penerimaan bahan" hint="Bandingkan dengan kg order. Selisih besar perlu dicek ke supplier.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className={theadRow}>
                <th className={th}>Warna / artikel</th>
                <th className={th}>Supplier</th>
                <th className={`${th} text-right`}>KG order</th>
                <th className={`${th} text-right`}>KG datang</th>
                <th className={`${th} text-right`}>Selisih</th>
                <th className={th}>Stok bahan sejenis</th>
              </tr>
            </thead>
            <tbody>
              {allVariants(po).map(({ item, variant: v }) => {
                const diff = v.kgMasuk != null && v.kgOrder != null ? v.kgMasuk - v.kgOrder : null;
                const avail = stokBahan.find((s) => s.nama === v.bahan && s.warna === v.warna && s.qty > 0);
                return (
                  <tr key={v.id} className={tbodyRow}>
                    <td className={td}>
                      <p className="font-medium text-[#0b0b0b]">{v.warna}</p>
                      <p className="text-xs text-[#898781]">{item.artikel} · {v.bahan}</p>
                    </td>
                    <td className={`${td} text-[#52514e]`}>{v.supplier ?? "—"}</td>
                    <td className={`${td} text-right tabular-nums`}>{v.kgOrder != null ? `${fmt(v.kgOrder)} kg` : "—"}</td>
                    <td className={`${td} text-right`}>
                      <input
                        type="number" min={0} inputMode="decimal"
                        value={v.kgMasuk ?? ""}
                        onChange={(e) => updatePo(po.id, (p) => patchVariant(p, v.id, { kgMasuk: parseNum(e.target.value) }))}
                        placeholder="kg"
                        className={`${inputCls} ml-auto w-24 text-right ${!v.kgMasuk ? "border-[#fab219]" : ""}`}
                      />
                    </td>
                    <td className={`${td} text-right font-semibold tabular-nums ${diff == null ? "" : diff < 0 ? "text-[#a82f2f]" : "text-[#0a8a0a]"}`}>
                      {diff == null ? "—" : `${diff > 0 ? "+" : ""}${fmt(diff)} kg`}
                    </td>
                    <td className={`${td} text-xs`}>
                      {avail ? (
                        <Link href="/stok" className="font-medium text-[#1f5aa8] hover:underline">
                          Ada {fmt(avail.qty)} kg di stok →
                        </Link>
                      ) : (
                        <span className="text-[#898781]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Callout>
        KG hanya dipakai untuk beli & terima bahan. Mulai tahap <b>Marker</b>, kebutuhan dan pemakaian kain dihitung dalam <b>yard</b>.
      </Callout>
    </>
  );
}
