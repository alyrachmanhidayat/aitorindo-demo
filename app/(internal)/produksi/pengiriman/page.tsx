"use client";

import Link from "next/link";
import HandoverStage from "@/components/HandoverStage";
import StageShell from "@/components/StageShell";
import { Callout } from "@/components/ui";

export default function PengirimanPage() {
  return (
    <StageShell
      stage="pengiriman"
      intro="Barang hasil finishing dikirim ke customer. Catat qty yang dikirim / diterima customer per size."
    >
      {(po) => (
        <>
          <HandoverStage po={po} stage="pengiriman" outLabel="Dikirim" />
          <Callout>
            Setelah ditandai terkirim, PO muncul di halaman <Link href="/invoice" className="font-medium underline">Invoice</Link>{" "}
            untuk diterbitkan tagihannya.
          </Callout>
        </>
      )}
    </StageShell>
  );
}
