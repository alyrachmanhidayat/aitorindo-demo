"use client";

import { createContext, useContext, useState } from "react";
import { DEMO_TODAY, paidInvoices, unpaidInvoices, type Invoice } from "./dummy-data";
import { blankMarker } from "./marker";
import {
  allVariants,
  initialLosses,
  initialMarkerPlans,
  initialPos,
  initialStock,
  poTotalDp,
  poTotalInvoice,
  PRODUCTION_STAGES,
  stageIndex,
  type LossRecord,
  type MarkerPlan,
  type Po,
  type StockEntry,
} from "./po-data";

type Selection = { poId: string; variantId: string };

type PoStore = {
  pos: Po[];
  plans: Record<string, MarkerPlan>;
  invoices: Invoice[];
  losses: LossRecord[];
  stock: StockEntry[];
  selection: Selection;
  select: (s: Selection) => void;
  /** Returns the plan for a colour, or a fresh blank draft if none exists yet. */
  getPlan: (variantId: string) => MarkerPlan;
  savePlan: (plan: MarkerPlan) => void;
  setPemakaian: (variantId: string, yard: number | null) => void;
  /** Immutable update of one PO. */
  updatePo: (poId: string, fn: (po: Po) => Po) => void;
  /** Moves a PO to the next phase / stage, applying the side effects of the stage it leaves. */
  advanceStage: (poId: string) => void;
  addLoss: (rec: Omit<LossRecord, "id">) => void;
  removeLoss: (id: number) => void;
  addStock: (entry: Omit<StockEntry, "id">) => void;
  addPo: (po: Omit<Po, "id" | "noPo">) => Po;
  /** Creates the single invoice for a delivered PO; returns it. */
  publishInvoice: (poId: string) => Invoice | null;
  pay: (invoiceId: number, amount: number) => Invoice | null;
};

const Ctx = createContext<PoStore | null>(null);

let seq = 0;
const newId = (prefix: string) => `${prefix}-${Date.now()}-${++seq}`;

export function PoStoreProvider({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState<Po[]>(initialPos);
  const [plans, setPlans] = useState<Record<string, MarkerPlan>>(initialMarkerPlans);
  const [invoices, setInvoices] = useState<Invoice[]>([...unpaidInvoices, ...paidInvoices]);
  const [losses, setLosses] = useState<LossRecord[]>(initialLosses);
  const [stock, setStock] = useState<StockEntry[]>(initialStock);
  const [selection, select] = useState<Selection>({
    poId: initialPos[0].id,
    variantId: initialPos[0].items[0].variants[0].id,
  });

  const getPlan = (variantId: string): MarkerPlan =>
    plans[variantId] ?? { variantId, markers: [blankMarker()], allowance: "3%", status: "draft", pemakaianAktual: null };

  const savePlan = (plan: MarkerPlan) => setPlans((prev) => ({ ...prev, [plan.variantId]: plan }));

  const setPemakaian = (variantId: string, yard: number | null) =>
    setPlans((prev) => ({ ...prev, [variantId]: { ...getPlan(variantId), ...prev[variantId], pemakaianAktual: yard } }));

  const updatePo = (poId: string, fn: (po: Po) => Po) => setPos((prev) => prev.map((po) => (po.id === poId ? fn(po) : po)));

  const addStock = (entry: Omit<StockEntry, "id">) => setStock((prev) => [{ ...entry, id: newId("stk") }, ...prev]);

  const advanceStage = (poId: string) => {
    const po = pos.find((p) => p.id === poId);
    if (!po) return;
    const vs = allVariants(po).map((x) => x.variant);
    let next: Po = { ...po };

    // Side effects of leaving the current stage.
    if (po.stage === "order_kain") {
      // Fabric order becomes material cost lines (per colour).
      const lines = vs
        .filter((v) => v.kgOrder && v.hargaKg && !po.materialCost.some((l) => l.variantId === v.id))
        .map((v) => ({ tanggal: DEMO_TODAY, unit: `${v.bahan} ${v.warna} (${v.supplier})`, qty: v.kgOrder!, satuan: "KG" as const, harga: v.hargaKg!, variantId: v.id }));
      next.materialCost = [...po.materialCost, ...lines];
    }
    if (po.stage === "dateng_bahan") {
      // Material cost follows the kg that actually arrived.
      next.materialCost = po.materialCost.map((l) => {
        const v = vs.find((x) => x.id === l.variantId);
        return v?.kgMasuk ? { ...l, qty: v.kgMasuk } : l;
      });
    }
    if (po.stage === "cutting") {
      // Leftover fabric goes to Stok Bahan.
      for (const v of vs) {
        const kg = po.sisaKainKg[v.id];
        if (kg && kg > 0)
          addStock({ tanggal: DEMO_TODAY, jenis: "bahan", nama: v.bahan, warna: v.warna, size: null, qty: kg, satuan: "KG", arah: "masuk", sumber: po.noPo, keterangan: "Sisa kain setelah cutting" });
      }
    }

    const idx = stageIndex(po.stage);
    const info = PRODUCTION_STAGES[idx];
    if (info.twoPhase && po.fase === "antri") next.fase = "proses";
    else if (idx === PRODUCTION_STAGES.length - 1) next.terkirim = true;
    else next = { ...next, stage: PRODUCTION_STAGES[idx + 1].key, fase: "antri" };

    setPos((prev) => prev.map((p) => (p.id === poId ? next : p)));
  };

  const addLoss = (rec: Omit<LossRecord, "id">) => {
    const id = Date.now();
    setLosses((prev) => [...prev, { ...rec, id }]);
    // Good pieces kept back go to finished-goods stock.
    if (rec.kategori === "stok")
      setStock((prev) => [
        {
          id: newId("stk"), tanggal: rec.tanggal, jenis: "barang_jadi", nama: rec.artikel, warna: rec.warna, size: rec.size,
          qty: rec.qty, satuan: "PCS", arah: "masuk", sumber: rec.noPo, keterangan: `Lost ${rec.tahap} kategori stok: ${rec.alasan || "-"}`, lossId: id,
        },
        ...prev,
      ]);
  };

  const removeLoss = (id: number) => {
    setLosses((prev) => prev.filter((l) => l.id !== id));
    setStock((prev) => prev.filter((e) => e.lossId !== id));
  };

  const addPo = (data: Omit<Po, "id" | "noPo">): Po => {
    const seqNo = 10 + pos.filter((p) => p.noPo.startsWith("PO/09/2026/")).length;
    const po: Po = { ...data, id: `po-${Date.now()}`, noPo: `PO/09/2026/${String(seqNo).padStart(4, "0")}` };
    setPos((prev) => [po, ...prev]);
    select({ poId: po.id, variantId: po.items[0].variants[0].id });
    return po;
  };

  const publishInvoice = (poId: string): Invoice | null => {
    const po = pos.find((p) => p.id === poId);
    if (!po || invoices.some((i) => i.poId === poId)) return null;
    const seqNo = invoices.filter((i) => i.invoiceNumber.startsWith("INV/09/2026/")).length + 4;
    const totalPo = poTotalInvoice(po);
    const dpAmount = poTotalDp(po);
    const invoice: Invoice = {
      id: Date.now(),
      invoiceNumber: `INV/09/2026/${String(seqNo).padStart(4, "0")}`,
      poId: po.id,
      noPo: po.noPo,
      namaPo: po.namaPo,
      brand: po.brand,
      totalPo,
      dpAmount,
      totalAmount: totalPo - dpAmount,
      paidAmount: 0,
      isPaid: false,
      issuedDate: DEMO_TODAY,
      payments: [],
    };
    setInvoices((prev) => [invoice, ...prev]);
    return invoice;
  };

  const pay = (invoiceId: number, amount: number): Invoice | null => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return null;
    const paidAmount = Math.min(inv.paidAmount + amount, inv.totalAmount);
    const updated: Invoice = {
      ...inv,
      paidAmount,
      isPaid: paidAmount >= inv.totalAmount,
      payments: [...inv.payments, { date: DEMO_TODAY, amount }],
    };
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? updated : i)));
    return updated;
  };

  return (
    <Ctx.Provider
      value={{
        pos, plans, invoices, losses, stock, selection, select, getPlan, savePlan, setPemakaian, updatePo, advanceStage,
        addLoss, removeLoss, addStock, addPo, publishInvoice, pay,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function usePoStore(): PoStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePoStore must be used inside <PoStoreProvider>");
  return ctx;
}
