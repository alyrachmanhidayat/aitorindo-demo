"use client";

import HandoverStage from "@/components/HandoverStage";
import StageShell from "@/components/StageShell";
import VendorAssign from "@/components/VendorAssign";
import { Callout } from "@/components/ui";

export default function FinishingPage() {
  return (
    <StageShell
      stage="finishing"
      intro={
        <>
          <b>Antri Finishing → Finishing.</b> QC, buang benang, setrika, lipat & packing. Barang masuk = hasil sewing.
        </>
      }
    >
      {(po) =>
        po.fase === "antri" ? (
          <>
            <VendorAssign po={po} stage="finishing" title="Tim / vendor finishing per size" />
            <Callout>Klik <b>Mulai Finishing</b> setelah semua size punya penanggung jawab.</Callout>
          </>
        ) : (
          <HandoverStage po={po} stage="finishing" outLabel="Lolos finishing" />
        )
      }
    </StageShell>
  );
}
