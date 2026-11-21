"use client";

import HandoverStage from "@/components/HandoverStage";
import StageShell from "@/components/StageShell";
import VendorAssign from "@/components/VendorAssign";
import { Callout } from "@/components/ui";

export default function SewingPage() {
  return (
    <StageShell
      stage="sewing"
      intro={
        <>
          <b>Antri Sewing → Sewing.</b> Saat antri, bagi pekerjaan ke vendor jahit (boleh split per size). Saat proses, catat
          hasil jahit yang kembali dan kategorikan setiap barang yang kurang.
        </>
      }
    >
      {(po) =>
        po.fase === "antri" ? (
          <>
            <VendorAssign po={po} stage="sewing" title="Vendor sewing per size" />
            <Callout>Klik <b>Mulai Sewing</b> setelah semua size punya vendor.</Callout>
          </>
        ) : (
          <HandoverStage po={po} stage="sewing" outLabel="Hasil sewing" />
        )
      }
    </StageShell>
  );
}
