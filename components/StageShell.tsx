"use client";

import Link from "next/link";
import { useState } from "react";
import Badge from "@/components/Badge";
import PoStepper from "@/components/PoStepper";
import Toast from "@/components/Toast";
import { DEMO_TODAY, urgencyTone } from "@/lib/dummy-data";
import { daysUntil, formatDate, formatNumber } from "@/lib/format";
import {
  advanceLabel,
  allVariants,
  poTotalQty,
  PRODUCTION_STAGES,
  stageBlocker,
  stageIndex,
  stageInfo,
  stageLabel,
  type Fase,
  type Po,
  type StageKey,
} from "@/lib/po-data";
import { usePoStore } from "@/lib/po-store";

/**
 * Page frame shared by every production stage: header, queue of POs at this stage,
 * the selected PO's header with the "move on" button, then the stage-specific body.
 */
export default function StageShell({
  stage,
  intro,
  children,
}: {
  stage: StageKey;
  intro: React.ReactNode;
  children: (po: Po) => React.ReactNode;
}) {
  const { pos, plans, losses, selection, select, advanceStage } = usePoStore();
  const [faseFilter, setFaseFilter] = useState<Fase | "all">("all");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const info = stageInfo(stage);
  const idx = stageIndex(stage);
  const prev = PRODUCTION_STAGES[idx - 1];
  const next = PRODUCTION_STAGES[idx + 1];

  const atStage = pos.filter((p) => p.stage === stage && !p.terkirim);
  const queue = atStage
    .filter((p) => faseFilter === "all" || p.fase === faseFilter)
    .sort((a, b) => a.tanggalKirim.localeCompare(b.tanggalKirim));
  const passed = pos.filter((p) => p.terkirim || stageIndex(p.stage) > idx).length;

  const po =
    queue.find((p) => p.id === pickedId) ?? queue.find((p) => p.id === selection.poId) ?? queue[0] ?? null;

  const pick = (p: Po) => {
    setPickedId(p.id);
    select({ poId: p.id, variantId: p.items[0].variants[0].id });
  };

  function move(p: Po) {
    const label = advanceLabel(p);
    advanceStage(p.id);
    setToast(
      p.stage === "pengiriman"
        ? `${p.namaPo} terkirim — siap diterbitkan invoice.`
        : info.twoPhase && p.fase === "antri"
          ? `${p.namaPo} mulai ${info.label}.`
          : `${p.namaPo}: ${label.replace(" →", "")}.`
    );
    setTimeout(() => setToast(null), 3000);
  }

  const blocker = po ? stageBlocker(po, plans, losses) : null;

  return (
    <div className="space-y-6">
      {/* ---------- Stage header ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-[#898781]">
            Tahap {info.no} dari {PRODUCTION_STAGES.length}
          </p>
          <h2 className="text-xl font-semibold text-[#0b0b0b]">{info.label}</h2>
          <div className="mt-1 text-sm text-[#52514e]">{intro}</div>
        </div>
        <div className="flex gap-2 text-sm">
          {prev && (
            <Link href={prev.href} className="rounded-lg border border-[#e1e0d9] bg-white px-3 py-2 text-[#52514e] hover:bg-[#f4f3f0]">
              ← {prev.no}. {prev.label}
            </Link>
          )}
          {next && (
            <Link href={next.href} className="rounded-lg border border-[#e1e0d9] bg-white px-3 py-2 text-[#52514e] hover:bg-[#f4f3f0]">
              {next.no}. {next.label} →
            </Link>
          )}
        </div>
      </div>

      {/* ---------- Queue ---------- */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#0b0b0b]">
            {atStage.length} PO di tahap ini
            <span className="ml-2 text-xs font-normal text-[#898781]">· {passed} PO sudah melewati tahap ini</span>
          </p>
          {info.twoPhase && (
            <div className="inline-flex rounded-lg border border-[#e1e0d9] bg-white p-1 text-xs">
              {(["all", "antri", "proses"] as const).map((f) => {
                const n = f === "all" ? atStage.length : atStage.filter((p) => p.fase === f).length;
                return (
                  <button
                    key={f}
                    onClick={() => setFaseFilter(f)}
                    className={`rounded-md px-3 py-1.5 font-medium ${faseFilter === f ? "bg-[#2a78d6] text-white" : "text-[#52514e] hover:bg-[#f4f3f0]"}`}
                  >
                    {f === "all" ? "Semua" : f === "antri" ? `Antri ${info.label}` : info.label} ({n})
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {queue.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c9c7bf] bg-white px-5 py-10 text-center text-sm text-[#898781]">
            Tidak ada PO di {faseFilter === "all" ? "tahap ini" : faseFilter === "antri" ? `antrian ${info.label}` : `proses ${info.label}`}.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {queue.map((p) => {
              const active = p.id === po?.id;
              const left = daysUntil(p.tanggalKirim, DEMO_TODAY);
              const ready = !stageBlocker(p, plans, losses);
              return (
                <button
                  key={p.id}
                  onClick={() => pick(p)}
                  className={`rounded-xl border bg-white p-4 text-left shadow-sm transition-colors ${
                    active ? "border-[#2a78d6] ring-2 ring-[#2a78d6]/20" : "border-[#e1e0d9] hover:border-[#c9c7bf]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#0b0b0b]">{p.namaPo}</p>
                      <p className="text-xs text-[#898781]">{p.noPo} · {p.brand}</p>
                    </div>
                    {info.twoPhase ? (
                      <Badge tone={p.fase === "antri" ? "warning" : "info"}>{p.fase === "antri" ? "Antri" : "Proses"}</Badge>
                    ) : (
                      <Badge tone={ready ? "good" : "neutral"}>{ready ? "Siap lanjut" : "Berjalan"}</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[#52514e]">
                    {allVariants(p).length} warna · {formatNumber(poTotalQty(p))} pcs
                  </p>
                  <div className="mt-2">
                    <Badge tone={urgencyTone(left)}>Kirim {formatDate(p.tanggalKirim)} · H-{left}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------- Selected PO ---------- */}
      {po && (
        <>
          <section className="rounded-xl border border-[#e1e0d9] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[#898781]">{po.noPo} · {po.brand}</p>
                <h3 className="text-lg font-semibold text-[#0b0b0b]">{po.namaPo}</h3>
                <p className="mt-0.5 text-sm text-[#52514e]">
                  {stageLabel(po)} · {formatNumber(poTotalQty(po))} pcs · kirim {formatDate(po.tanggalKirim)}
                  <Link href="/po" onClick={() => pick(po)} className="ml-2 text-xs font-medium text-[#1f5aa8] hover:underline">
                    Detail PO →
                  </Link>
                </p>
              </div>
              <div className="text-right">
                <button
                  disabled={!!blocker}
                  onClick={() => move(po)}
                  className="rounded-lg bg-[#2a78d6] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1f5aa8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {advanceLabel(po)}
                </button>
                {blocker && <p className="mt-1.5 max-w-xs text-xs text-[#a82f2f]">{blocker}</p>}
              </div>
            </div>
            <div className="mt-4">
              <PoStepper po={po} />
            </div>
          </section>
          {children(po)}
        </>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
