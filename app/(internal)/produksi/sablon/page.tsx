"use client";

import StageShell from "@/components/StageShell";
import VendorAssign from "@/components/VendorAssign";
import { Callout } from "@/components/ui";

export default function SablonPage() {
  return (
    <StageShell stage="sablon" intro="Potongan kain diserahkan ke vendor sablon / bordir. Qty mengikuti hasil cutting.">
      {(po) => (
        <>
          <VendorAssign po={po} stage="sablon" title="Vendor sablon / bordir per size" />
          <Callout>
            Setelah sablon selesai dan semua vendor tercatat, lanjutkan ke <b>Antri Sewing</b>. Penghitungan barang lost
            dimulai dari tahap Sewing.
          </Callout>
        </>
      )}
    </StageShell>
  );
}
