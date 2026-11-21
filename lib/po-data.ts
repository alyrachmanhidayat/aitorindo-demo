// All data on this file is fictional, generated for a sales demo only.
import type { Marker, SizeQty } from "./marker";

/**
 * 8 production stages, one page each.
 * Sewing & Finishing have two phases: "antri" (queue) then "proses" (in progress).
 */
export const PRODUCTION_STAGES = [
  { key: "order_kain", no: 1, label: "Order Kain", short: "Order", href: "/produksi/order-kain", twoPhase: false },
  { key: "dateng_bahan", no: 2, label: "Datang Bahan", short: "Bahan", href: "/produksi/datang-bahan", twoPhase: false },
  { key: "marker", no: 3, label: "Marker", short: "Marker", href: "/produksi/marker", twoPhase: false },
  { key: "cutting", no: 4, label: "Antri Cutting", short: "Cutting", href: "/produksi/cutting", twoPhase: false },
  { key: "sablon", no: 5, label: "Antri Sablon", short: "Sablon", href: "/produksi/sablon", twoPhase: false },
  { key: "sewing", no: 6, label: "Sewing", short: "Sewing", href: "/produksi/sewing", twoPhase: true },
  { key: "finishing", no: 7, label: "Finishing", short: "Finish", href: "/produksi/finishing", twoPhase: true },
  { key: "pengiriman", no: 8, label: "Pengiriman", short: "Kirim", href: "/produksi/pengiriman", twoPhase: false },
] as const;

export type StageKey = (typeof PRODUCTION_STAGES)[number]["key"];
export type Fase = "antri" | "proses";

/** Stages that record a qty result per size. Cutting result makes the PO qty dynamic. */
export type HasilStage = "cutting" | "sewing" | "finishing" | "pengiriman";
/** From Sewing onward, missing pieces must be categorised (stok / reject / hilang). */
export type LossStage = "sewing" | "finishing" | "pengiriman";
export const LOSS_STAGES: LossStage[] = ["sewing", "finishing", "pengiriman"];
/** Stages handed over to (possibly several) vendors, assigned per size (split vendor). */
export type VendorStage = "sablon" | "sewing" | "finishing";

export function stageIndex(key: StageKey): number {
  return PRODUCTION_STAGES.findIndex((s) => s.key === key);
}
export function stageInfo(key: StageKey) {
  return PRODUCTION_STAGES[stageIndex(key)];
}

/** One fabric colour of a PO item. Each colour has its own marker plan. */
export type ColorVariant = {
  id: string;
  warna: string;
  bahan: string;
  /** Fabric width in cm. */
  lebarKain: number;
  /** Order Kain: supplier, kg ordered and price per kg. KG is only used to buy / receive fabric. */
  supplier: string | null;
  kgOrder: number | null;
  hargaKg: number | null;
  /** Datang Bahan: fabric actually received in kg. */
  kgMasuk: number | null;
  /** Ordered qty per size (original PO). */
  sizes: SizeQty[];
};

export type PoItem = {
  id: string;
  artikel: string;
  /** Selling price per piece. */
  hargaJual: number;
  variants: ColorVariant[];
};

export type CostLine = {
  tanggal: string;
  unit: string;
  qty: number;
  satuan: "KG" | "PCS" | "YARD";
  harga: number;
  /** Set when the line was generated from a colour's fabric order. */
  variantId?: string;
};

export type Dp = {
  tanggal: string;
  jenis: "bahan" | "uang";
  nominal: number;
  keterangan: string;
};

/** qty per size, keyed by variantId then size. */
export type SizeMap = Record<string, Record<string, number>>;

/** Pieces lost from Sewing onward: categorised as stok, reject, or hilang (reject/hilang need a reason + PIC). */
export type LossRecord = {
  id: number;
  tanggal: string;
  poId: string;
  variantId: string;
  noPo: string;
  namaPo: string;
  artikel: string;
  warna: string;
  size: string;
  qty: number;
  hargaJual: number;
  tahap: LossStage;
  kategori: "stok" | "reject" | "hilang";
  alasan: string;
  pic: string;
};

/** Stock ledger: finished goods (from "stok" losses) and leftover fabric (from Cutting). */
export type StockEntry = {
  id: string;
  tanggal: string;
  jenis: "barang_jadi" | "bahan";
  /** Artikel (barang jadi) or bahan name. */
  nama: string;
  warna: string;
  /** Size for barang jadi; null for bahan. */
  size: string | null;
  qty: number;
  satuan: "PCS" | "KG";
  arah: "masuk" | "keluar";
  /** Source / destination, e.g. a PO number or "Manual". */
  sumber: string;
  keterangan: string;
  /** Linked loss record, so deleting the loss also removes the stock. */
  lossId?: number;
};

export type Po = {
  id: string;
  noPo: string;
  /** PO name, e.g. "Twinhue" — one PO can contain many colours. */
  namaPo: string;
  brand: string;
  tanggalMasuk: string;
  tanggalKirim: string;
  stage: StageKey;
  /** Phase within a two-phase stage (Sewing / Finishing). Other stages are always "antri" until done. */
  fase: Fase;
  /** True once the last stage (Pengiriman) is done — PO is ready for invoicing. */
  terkirim: boolean;
  /** Staged down payments, fabric or cash. */
  dp: Dp[];
  items: PoItem[];
  materialCost: CostLine[];
  serviceCost: CostLine[];
  /** Qty out of each stage per colour & size. */
  hasil: Partial<Record<HasilStage, SizeMap>>;
  /** Vendor per colour & size (key `${variantId}|${size}`) — one stage can be split over several vendors. */
  vendor: Partial<Record<VendorStage, Record<string, string>>>;
  /** Leftover fabric after Cutting, kg per colour — goes to Stok Bahan. */
  sisaKainKg: Record<string, number | null>;
};

export type MarkerPlan = {
  variantId: string;
  markers: Marker[];
  /** Allowance as yard ("5") or percentage ("5%"). */
  allowance: string;
  status: "draft" | "final";
  /** Filled at Cutting: actual fabric used, in yard (same unit as the marker plan). */
  pemakaianAktual: number | null;
};

/** Fee percentages — DUMMY values, still need validation with the customer. Base: total invoice (harga jual). */
export const FEE_RULES = [
  { key: "alddy", label: "Fee Alddy", percent: 2 },
  { key: "wawan", label: "Fee Wawan", percent: 1.5 },
] as const;

export const vKey = (variantId: string, size: string) => `${variantId}|${size}`;

const sz = (pairs: [string, number][]): SizeQty[] => pairs.map(([size, qty]) => ({ size, qty }));

const mk = (
  id: string,
  ratio: Record<string, number>,
  panjang: number,
  lebar: number,
  tambahan = 2
): Marker => ({ id, ratio, panjang, tambahan, lebar, auto: true, ampar: 0, images: [] });

/** Size map from a colour's ordered sizes, with per-size adjustments. */
const sizeMap = (v: ColorVariant, adj: Record<string, number> = {}): SizeMap => ({
  [v.id]: Object.fromEntries(v.sizes.map((s) => [s.size, s.qty + (adj[s.size] ?? 0)])),
});
const vendorAll = (v: ColorVariant, name: string | ((size: string) => string)) =>
  Object.fromEntries(v.sizes.map((s) => [vKey(v.id, s.size), typeof name === "string" ? name : name(s.size)]));

const variant = (
  id: string, warna: string, bahan: string, lebarKain: number, sizes: [string, number][],
  order: { supplier: string; kg: number; harga: number } | null, kgMasuk: number | null
): ColorVariant => ({
  id, warna, bahan, lebarKain, sizes: sz(sizes),
  supplier: order?.supplier ?? null, kgOrder: order?.kg ?? null, hargaKg: order?.harga ?? null, kgMasuk,
});

const blank = { fase: "antri" as Fase, hasil: {}, vendor: {}, sisaKainKg: {} };

// ---------- Demo POs ----------

const vTankHitam = variant("v-tank-hitam", "Hitam", "Cotton Combed 24s", 180, [["S", 20], ["M", 40], ["L", 50], ["XL", 30]], { supplier: "PT Kahatex", kg: 38, harga: 112000 }, 38);
const vTankAbu = variant("v-tank-abu", "Abu Misty", "Cotton Combed 24s", 180, [["S", 15], ["M", 35], ["L", 40], ["XL", 20]], { supplier: "PT Kahatex", kg: 30, harga: 112000 }, 30);
const vKaosNavy = variant("v-kaos-navy", "Navy", "Cotton Combed 20s", 180, [["M", 30], ["L", 40], ["XL", 30]], { supplier: "CV Sinar Tekstil", kg: 42, harga: 118000 }, 42);
const vBaros = variant("v-baros-khaki", "Khaki", "Ripstop Baby", 150, [["M", 30], ["L", 71], ["XL", 50], ["XXL", 30]], { supplier: "Toko Kain Cigondewah", kg: 64, harga: 145000 }, 64);
const vSky = variant("v-sky-blue", "Sky Blue", "Cotton Combed 24s", 180, [["S", 60], ["M", 120], ["L", 160], ["XL", 100]], { supplier: "Kain dari customer", kg: 92, harga: 110000 }, 92);
const vJerseyMerah = variant("v-jersey-merah", "Merah", "Interlock Dryfit", 170, [["S", 10], ["M", 30], ["L", 35], ["XL", 15]], null, null);
const vJerseyPutih = variant("v-jersey-putih", "Putih", "Interlock Dryfit", 170, [["S", 10], ["M", 30], ["L", 35], ["XL", 15]], null, null);

const VENDOR_SABLON = "Sablon Mitra — Pak Ujang";
const VENDOR_SEW_A = "Vendor Sewing A — Bu Sri";
const VENDOR_SEW_B = "Vendor Sewing B — Pak Darto";
const FINISHING_INHOUSE = "Finishing In-house — Asep";

const hoodie = simplePo("po-hoodie", "PO/09/2026/0002", "Hoodie Komunitas Motor", "PT Sinergi Busana", "2026-09-04", "2026-09-26", "sablon",
  "Hoodie Zipper", 165000, "Hitam", "Fleece 320gsm", 180, 96, [["M", 60], ["L", 70], ["XL", 30], ["XXL", 10]], 15_000_000);
const polo = simplePo("po-polo", "PO/09/2026/0004", "Polo Kantor", "CV Mitra Garmen Sejahtera", "2026-09-06", "2026-09-27", "finishing",
  "Polo Shirt", 95000, "Putih", "Lacoste CVC", 180, 52, [["S", 15], ["M", 45], ["L", 50], ["XL", 20]], 4_000_000);
const poloV = polo.items[0].variants[0];
const rompi = simplePo("po-rompi", "PO/08/2026/0038", "Rompi Proyek Bangun Karya", "UD Konveksi Jaya Abadi", "2026-08-24", "2026-09-15", "pengiriman",
  "Rompi Proyek", 98000, "Oranye", "Parasut Waterproof", 150, 33, [["M", 25], ["L", 30], ["XL", 25]], 2_500_000, true);
const rompiV = rompi.items[0].variants[0];

export const initialPos: Po[] = [
  {
    ...blank,
    id: "po-twinhue",
    noPo: "PO/09/2026/0007",
    namaPo: "Twinhue",
    brand: "Suma Apparel",
    tanggalMasuk: "2026-09-12",
    tanggalKirim: "2026-10-10",
    stage: "marker",
    terkirim: false,
    dp: [
      { tanggal: "2026-09-12", jenis: "bahan", nominal: 7_616_000, keterangan: "Kain Cotton Combed 24s 68 kg dari customer" },
      { tanggal: "2026-09-14", jenis: "uang", nominal: 5_000_000, keterangan: "Transfer BCA" },
    ],
    items: [
      { id: "it-tank", artikel: "Tank Top Twinhue", hargaJual: 65000, variants: [vTankHitam, vTankAbu] },
      { id: "it-kaos", artikel: "Kaos Oversize Twinhue", hargaJual: 85000, variants: [vKaosNavy] },
    ],
    materialCost: [
      { tanggal: "2026-09-13", unit: "Cotton Combed 24s Hitam", qty: 38, satuan: "KG", harga: 112000, variantId: vTankHitam.id },
      { tanggal: "2026-09-13", unit: "Cotton Combed 24s Abu Misty", qty: 30, satuan: "KG", harga: 112000, variantId: vTankAbu.id },
      { tanggal: "2026-09-14", unit: "Cotton Combed 20s Navy", qty: 42, satuan: "KG", harga: 118000, variantId: vKaosNavy.id },
    ],
    serviceCost: [
      { tanggal: "2026-09-16", unit: "Sablon 2 warna", qty: 350, satuan: "PCS", harga: 9000 },
      { tanggal: "2026-09-16", unit: "Jahit (CMT)", qty: 350, satuan: "PCS", harga: 12000 },
    ],
  },
  {
    ...blank,
    id: "po-3991",
    noPo: "PO/09/2026/3991",
    namaPo: "Baros TAC",
    brand: "Tachsen",
    tanggalMasuk: "2026-09-05",
    tanggalKirim: "2026-10-02",
    stage: "cutting",
    terkirim: false,
    dp: [{ tanggal: "2026-09-05", jenis: "uang", nominal: 10_000_000, keterangan: "DP 30%" }],
    items: [{ id: "it-baros", artikel: "Baros TAC T Pendek", hargaJual: 175000, variants: [vBaros] }],
    materialCost: [{ tanggal: "2026-09-06", unit: "Ripstop Baby Khaki", qty: 64, satuan: "KG", harga: 145000, variantId: vBaros.id }],
    serviceCost: [
      { tanggal: "2026-09-10", unit: "Bordir logo dada", qty: 181, satuan: "PCS", harga: 7500 },
      { tanggal: "2026-09-10", unit: "Jahit kemeja (CMT)", qty: 181, satuan: "PCS", harga: 32000 },
    ],
  },
  {
    id: "po-skyblue",
    noPo: "PO/08/2026/0031",
    namaPo: "Sky Blue",
    brand: "Suma Apparel",
    tanggalMasuk: "2026-08-25",
    tanggalKirim: "2026-09-26",
    stage: "sewing",
    fase: "proses",
    terkirim: false,
    dp: [{ tanggal: "2026-08-25", jenis: "bahan", nominal: 10_120_000, keterangan: "Kain Sky Blue 92 kg dari customer" }],
    items: [{ id: "it-sky", artikel: "Tank Top", hargaJual: 62000, variants: [vSky] }],
    materialCost: [{ tanggal: "2026-08-26", unit: "Cotton Combed 24s Sky Blue", qty: 92, satuan: "KG", harga: 110000, variantId: vSky.id }],
    serviceCost: [
      { tanggal: "2026-09-02", unit: "Sablon 1 warna", qty: 440, satuan: "PCS", harga: 6500 },
      { tanggal: "2026-09-08", unit: "Jahit (CMT)", qty: 440, satuan: "PCS", harga: 11000 },
    ],
    // Cutting came out 4 pcs over on XL -> PO qty became 444 (dynamic up to Cutting).
    hasil: {
      cutting: sizeMap(vSky, { XL: 4 }),
      sewing: sizeMap(vSky, { M: -2, L: -3 }),
    },
    vendor: {
      sablon: vendorAll(vSky, VENDOR_SABLON),
      // Split vendor: size S at vendor A, the rest at vendor B.
      sewing: vendorAll(vSky, (s) => (s === "S" ? VENDOR_SEW_A : VENDOR_SEW_B)),
    },
    sisaKainKg: { [vSky.id]: 2.4 },
  },
  {
    ...blank,
    id: "po-futsal",
    noPo: "PO/09/2026/0009",
    namaPo: "Jersey Futsal Korporat",
    brand: "PT Sportindo Utama",
    tanggalMasuk: "2026-09-17",
    tanggalKirim: "2026-10-20",
    stage: "order_kain",
    terkirim: false,
    dp: [],
    items: [{ id: "it-jersey", artikel: "Jersey Futsal", hargaJual: 120000, variants: [vJerseyMerah, vJerseyPutih] }],
    materialCost: [],
    serviceCost: [],
  },
  hoodie,
  {
    ...polo,
    fase: "proses",
    hasil: { ...polo.hasil, finishing: sizeMap(poloV, { M: -2 }) },
    vendor: { ...polo.vendor, finishing: vendorAll(poloV, FINISHING_INHOUSE) },
  },
  simplePo("po-gamis", "PO/09/2026/0008", "Gamis Majelis Taklim", "CV Anggun Fashion", "2026-09-15", "2026-10-05", "dateng_bahan",
    "Gamis", 145000, "Hijau Botol", "Kastina Premium", 150, null, [["S", 25], ["M", 55], ["L", 60], ["XL", 25]], 6_000_000),
  simplePo("po-piyama", "PO/08/2026/0035", "Piyama Anak Grosir", "CV Baju Anak Ceria", "2026-08-20", "2026-09-12", "pengiriman",
    "Setelan Piyama Anak", 58000, "Pink Pastel", "Cotton Combed 30s", 180, 40, [["S", 30], ["M", 40], ["L", 30]], 1_500_000, true),
  { ...rompi, hasil: { ...rompi.hasil, pengiriman: sizeMap(rompiV, { L: -1 }) } },
];

/** Compact builder for demo POs with a single item and colour. Fills stage results up to the given stage. */
function simplePo(
  id: string, noPo: string, namaPo: string, brand: string, tanggalMasuk: string, tanggalKirim: string, stage: StageKey,
  artikel: string, hargaJual: number, warna: string, bahan: string, lebarKain: number, kgMasuk: number | null,
  sizes: [string, number][], dpUang: number, terkirim = false
): Po {
  const qty = sizes.reduce((a, [, q]) => a + q, 0);
  const done = terkirim ? PRODUCTION_STAGES.length : stageIndex(stage);
  const kgOrder = kgMasuk ?? Math.round(qty * 0.28);
  const v = variant(`v-${id}`, warna, bahan, lebarKain, sizes, { supplier: "PT Kahatex", kg: kgOrder, harga: 105000 }, kgMasuk);
  const past = (k: StageKey) => done > stageIndex(k);
  const hasil: Po["hasil"] = {};
  if (past("cutting")) hasil.cutting = sizeMap(v);
  if (past("sewing")) hasil.sewing = sizeMap(v);
  if (past("finishing")) hasil.finishing = sizeMap(v);
  if (terkirim) hasil.pengiriman = sizeMap(v);
  const vendor: Po["vendor"] = {};
  if (past("sablon")) vendor.sablon = vendorAll(v, VENDOR_SABLON);
  if (done >= stageIndex("sewing")) vendor.sewing = vendorAll(v, VENDOR_SEW_A);
  if (past("finishing")) vendor.finishing = vendorAll(v, FINISHING_INHOUSE);
  return {
    id, noPo, namaPo, brand, tanggalMasuk, tanggalKirim, stage, fase: "antri", terkirim,
    dp: dpUang ? [{ tanggal: tanggalMasuk, jenis: "uang", nominal: dpUang, keterangan: "DP awal" }] : [],
    items: [{ id: `it-${id}`, artikel, hargaJual, variants: [v] }],
    materialCost: [{ tanggal: tanggalMasuk, unit: `${bahan} ${warna}`, qty: kgMasuk ?? kgOrder, satuan: "KG", harga: 105000, variantId: v.id }],
    serviceCost: done >= stageIndex("sablon") ? [
      { tanggal: tanggalMasuk, unit: "Sablon / bordir", qty, satuan: "PCS", harga: 8000 },
      { tanggal: tanggalMasuk, unit: "Jahit (CMT)", qty, satuan: "PCS", harga: 14000 },
    ] : [],
    hasil,
    vendor,
    sisaKainKg: past("cutting") ? { [v.id]: 1.5 } : {},
  };
}

export const initialMarkerPlans: Record<string, MarkerPlan> = {
  "v-tank-hitam": {
    variantId: "v-tank-hitam",
    markers: [mk("m-th-1", { S: 1, M: 2, L: 2, XL: 1 }, 380, 176), mk("m-th-2", { L: 1, XL: 1 }, 150, 176)],
    allowance: "3%",
    status: "final",
    pemakaianAktual: null,
  },
  "v-tank-abu": {
    variantId: "v-tank-abu",
    markers: [mk("m-ta-1", { S: 1, M: 2, L: 2, XL: 1 }, 380, 176), mk("m-ta-2", { M: 1, L: 1 }, 0, 176)],
    allowance: "3%",
    status: "draft",
    pemakaianAktual: null,
  },
  // Same numbers as the sample print "po 3991.pdf"
  "v-baros-khaki": {
    variantId: "v-baros-khaki",
    markers: [mk("m-b-1", { M: 1, L: 2, XL: 1, XXL: 1 }, 647.5, 146), mk("m-b-2", { L: 1, XL: 2 }, 392, 146)],
    allowance: "5%",
    status: "final",
    pemakaianAktual: null,
  },
  "v-sky-blue": {
    variantId: "v-sky-blue",
    markers: [mk("m-s-1", { S: 1, M: 2, L: 3, XL: 2 }, 520, 176), mk("m-s-2", { S: 1, M: 2, L: 1 }, 260, 176)],
    allowance: "3%",
    status: "final",
    pemakaianAktual: 318,
  },
  "v-po-hoodie": { variantId: "v-po-hoodie", markers: [mk("m-h-1", { M: 2, L: 2, XL: 1 }, 610, 176), mk("m-h-2", { M: 1, L: 1, XXL: 1 }, 330, 176)], allowance: "3%", status: "final", pemakaianAktual: 268 },
  "v-po-polo": { variantId: "v-po-polo", markers: [mk("m-p-1", { S: 1, M: 3, L: 3, XL: 1 }, 640, 176), mk("m-p-2", { L: 2, XL: 2 }, 300, 176)], allowance: "3%", status: "final", pemakaianAktual: 165 },
  "v-po-piyama": { variantId: "v-po-piyama", markers: [mk("m-y-1", { S: 1, M: 1, L: 1 }, 290, 176)], allowance: "3%", status: "final", pemakaianAktual: 98 },
  "v-po-rompi": { variantId: "v-po-rompi", markers: [mk("m-r-1", { M: 1, L: 1, XL: 1 }, 260, 146)], allowance: "3%", status: "final", pemakaianAktual: 74 },
};

const loss = (
  id: number, tanggal: string, po: Po, size: string, qty: number, tahap: LossStage,
  kategori: LossRecord["kategori"], alasan: string, pic: string
): LossRecord => {
  const item = po.items[0];
  const v = item.variants[0];
  return {
    id, tanggal, poId: po.id, variantId: v.id, noPo: po.noPo, namaPo: po.namaPo, artikel: item.artikel, warna: v.warna,
    size, qty, hargaJual: item.hargaJual, tahap, kategori, alasan, pic,
  };
};
const skyPo = initialPos.find((p) => p.id === "po-skyblue")!;

export const initialLosses: LossRecord[] = [
  loss(1, "2026-09-10", skyPo, "L", 3, "sewing", "reject", "Jahitan ketiak miring, tidak bisa diperbaiki", VENDOR_SEW_B),
  loss(2, "2026-09-11", skyPo, "M", 2, "sewing", "hilang", "Selisih hitung saat serah terima dari vendor", VENDOR_SEW_B),
  loss(3, "2026-09-12", skyPo, "XL", 4, "sewing", "stok", "Lebih potong, tidak ikut dikirim ke customer", "Admin Gudang — Rina"),
  loss(4, "2026-09-13", polo, "M", 2, "finishing", "reject", "Noda tinta sablon di bagian dada", FINISHING_INHOUSE),
  loss(5, "2026-09-14", rompi, "L", 1, "pengiriman", "hilang", "Kurang 1 pcs saat diterima customer", "Kurir — Budi"),
];

let stockSeq = 0;
const st = (e: Omit<StockEntry, "id">): StockEntry => ({ ...e, id: `stk-init-${++stockSeq}` });

export const initialStock: StockEntry[] = [
  st({ tanggal: "2026-08-10", jenis: "barang_jadi", nama: "Kaos Polos Basic", warna: "Hitam", size: "L", qty: 12, satuan: "PCS", arah: "masuk", sumber: "PO/07/2026/0021", keterangan: "Lebih potong, sisa PO lama" }),
  st({ tanggal: "2026-08-10", jenis: "barang_jadi", nama: "Kaos Polos Basic", warna: "Hitam", size: "XL", qty: 6, satuan: "PCS", arah: "masuk", sumber: "PO/07/2026/0021", keterangan: "Lebih potong, sisa PO lama" }),
  st({ tanggal: "2026-08-28", jenis: "barang_jadi", nama: "Kaos Polos Basic", warna: "Hitam", size: "L", qty: 5, satuan: "PCS", arah: "keluar", sumber: "Penjualan eceran", keterangan: "Dijual ke reseller" }),
  st({ tanggal: "2026-09-09", jenis: "barang_jadi", nama: "Setelan Piyama Anak", warna: "Pink Pastel", size: "M", qty: 3, satuan: "PCS", arah: "masuk", sumber: "PO/08/2026/0035", keterangan: "Sisa produksi, tidak ikut dikirim" }),
  st({ tanggal: "2026-09-12", jenis: "barang_jadi", nama: "Tank Top", warna: "Sky Blue", size: "XL", qty: 4, satuan: "PCS", arah: "masuk", sumber: "PO/08/2026/0031", keterangan: "Lost Sewing kategori stok: lebih potong", lossId: 3 }),
  st({ tanggal: "2026-08-22", jenis: "bahan", nama: "Cotton Combed 30s", warna: "Pink Pastel", size: null, qty: 1.5, satuan: "KG", arah: "masuk", sumber: "PO/08/2026/0035", keterangan: "Sisa kain setelah cutting" }),
  st({ tanggal: "2026-08-27", jenis: "bahan", nama: "Parasut Waterproof", warna: "Oranye", size: null, qty: 1.5, satuan: "KG", arah: "masuk", sumber: "PO/08/2026/0038", keterangan: "Sisa kain setelah cutting" }),
  st({ tanggal: "2026-08-30", jenis: "bahan", nama: "Cotton Combed 24s", warna: "Sky Blue", size: null, qty: 2.4, satuan: "KG", arah: "masuk", sumber: "PO/08/2026/0031", keterangan: "Sisa kain setelah cutting" }),
  st({ tanggal: "2026-09-08", jenis: "bahan", nama: "Fleece 320gsm", warna: "Hitam", size: null, qty: 1.5, satuan: "KG", arah: "masuk", sumber: "PO/09/2026/0002", keterangan: "Sisa kain setelah cutting" }),
  st({ tanggal: "2026-09-10", jenis: "bahan", nama: "Lacoste CVC", warna: "Putih", size: null, qty: 1.5, satuan: "KG", arah: "masuk", sumber: "PO/09/2026/0004", keterangan: "Sisa kain setelah cutting" }),
  st({ tanggal: "2026-09-12", jenis: "bahan", nama: "Cotton Combed 24s", warna: "Hitam", size: null, qty: 4, satuan: "KG", arah: "masuk", sumber: "Manual", keterangan: "Retur kain dari supplier" }),
];

// ---------- Derived helpers ----------

export function allVariants(po: Po) {
  return po.items.flatMap((item) => item.variants.map((variant) => ({ item, variant })));
}

/** Returns a copy of the PO with one colour patched. */
export function patchVariant(po: Po, variantId: string, patch: Partial<ColorVariant>): Po {
  return {
    ...po,
    items: po.items.map((it) => ({ ...it, variants: it.variants.map((v) => (v.id === variantId ? { ...v, ...patch } : v)) })),
  };
}

/** Current qty per size:the Cutting result once it exists (PO is dynamic up to Cutting), else the ordered qty. */
export function effectiveSizes(po: Po, v: ColorVariant): SizeQty[] {
  const cut = po.hasil.cutting?.[v.id];
  return v.sizes.map((s) => ({ size: s.size, qty: cut?.[s.size] ?? s.qty }));
}

const sumSizes = (sizes: SizeQty[]) => sizes.reduce((a, s) => a + s.qty, 0);

export function variantQty(po: Po, v: ColorVariant): number {
  return sumSizes(effectiveSizes(po, v));
}

export function poOrderQty(po: Po): number {
  return allVariants(po).reduce((sum, { variant }) => sum + sumSizes(variant.sizes), 0);
}

export function poTotalQty(po: Po): number {
  return allVariants(po).reduce((sum, { variant }) => sum + variantQty(po, variant), 0);
}

export function poTotalInvoice(po: Po): number {
  return po.items.reduce((sum, item) => sum + item.hargaJual * item.variants.reduce((a, v) => a + variantQty(po, v), 0), 0);
}

export const lineTotal = (l: CostLine) => l.qty * l.harga;

export function poTotalDp(po: Po): number {
  return po.dp.reduce((a, d) => a + d.nominal, 0);
}

/** Rough progress: share of stages already passed (100% once terkirim). */
export function poProgress(po: Po): number {
  if (po.terkirim) return 100;
  const half = po.fase === "proses" ? 0.5 : 0;
  return Math.round(((stageIndex(po.stage) + half) / PRODUCTION_STAGES.length) * 100);
}

export function stageLabel(po: Po): string {
  if (po.terkirim) return "Terkirim";
  const s = stageInfo(po.stage);
  if (s.twoPhase) return po.fase === "antri" ? `Antri ${s.label}` : `Proses ${s.label}`;
  return s.label;
}

/** Pieces coming into a loss stage = result of the previous counted stage. */
export const PREV_HASIL: Record<LossStage, HasilStage> = { sewing: "cutting", finishing: "sewing", pengiriman: "finishing" };

export function masukQty(po: Po, stage: LossStage, variantId: string, size: string): number {
  return po.hasil[PREV_HASIL[stage]]?.[variantId]?.[size] ?? 0;
}

export function keluarQty(po: Po, stage: HasilStage, variantId: string, size: string): number | null {
  return po.hasil[stage]?.[variantId]?.[size] ?? null;
}

export function lossFor(losses: LossRecord[], poId: string, stage: LossStage, variantId?: string, size?: string) {
  return losses.filter(
    (l) => l.poId === poId && l.tahap === stage && (variantId == null || l.variantId === variantId) && (size == null || l.size === size)
  );
}

/** Why the PO cannot move on from its current stage / phase yet (null = it can). */
export function stageBlocker(po: Po, plans: Record<string, MarkerPlan>, losses: LossRecord[]): string | null {
  const vs = allVariants(po).map((x) => x.variant);
  const needVendor = (stage: VendorStage) =>
    vs.some((v) => v.sizes.some((s) => !po.vendor[stage]?.[vKey(v.id, s.size)]?.trim()))
      ? "Tentukan vendor untuk setiap warna & size."
      : null;
  const needHasil = (stage: LossStage, label: string) => {
    for (const v of vs)
      for (const s of v.sizes) {
        const out = keluarQty(po, stage, v.id, s.size);
        if (out == null) return `Isi qty ${label} untuk setiap warna & size.`;
        const selisih = masukQty(po, stage, v.id, s.size) - out;
        const tercatat = lossFor(losses, po.id, stage, v.id, s.size).reduce((a, l) => a + l.qty, 0);
        if (selisih !== tercatat) return `${v.warna} size ${s.size}: selisih ${selisih} pcs belum dikategorikan semua (stok / reject / hilang).`;
      }
    return null;
  };

  switch (po.stage) {
    case "order_kain":
      return vs.some((v) => !v.supplier?.trim() || !v.kgOrder) ? "Isi supplier dan kg order setiap warna." : null;
    case "dateng_bahan":
      return vs.some((v) => !v.kgMasuk) ? "Isi kg bahan yang datang untuk setiap warna." : null;
    case "marker":
      return vs.some((v) => plans[v.id]?.status !== "final") ? "Semua warna harus punya marker final." : null;
    case "cutting":
      if (vs.some((v) => plans[v.id]?.pemakaianAktual == null)) return "Isi pemakaian kain (yard) setiap warna.";
      if (vs.some((v) => v.sizes.some((s) => keluarQty(po, "cutting", v.id, s.size) == null))) return "Isi hasil cutting per size.";
      return null;
    case "sablon":
      return needVendor("sablon");
    case "sewing":
      return po.fase === "antri" ? needVendor("sewing") : needHasil("sewing", "hasil sewing");
    case "finishing":
      return po.fase === "antri" ? needVendor("finishing") : needHasil("finishing", "hasil finishing");
    case "pengiriman":
      return needHasil("pengiriman", "dikirim");
  }
}

/** Label for the button that moves a PO forward. */
export function advanceLabel(po: Po): string {
  const s = stageInfo(po.stage);
  if (s.twoPhase && po.fase === "antri") return `Mulai ${s.label}`;
  if (po.stage === "pengiriman") return "Tandai terkirim ✓";
  const next = PRODUCTION_STAGES[stageIndex(po.stage) + 1];
  return `Lanjut ke ${next.twoPhase ? `Antri ${next.label}` : next.label} →`;
}

/** Stock balance grouped by item (nama + warna + size). */
export function stockBalance(stock: StockEntry[], jenis: StockEntry["jenis"]) {
  const map = new Map<string, { nama: string; warna: string; size: string | null; satuan: StockEntry["satuan"]; qty: number; last: string; sumber: Set<string> }>();
  for (const e of stock) {
    if (e.jenis !== jenis) continue;
    const key = `${e.nama}|${e.warna}|${e.size ?? ""}`;
    const row = map.get(key) ?? { nama: e.nama, warna: e.warna, size: e.size, satuan: e.satuan, qty: 0, last: e.tanggal, sumber: new Set<string>() };
    row.qty += e.arah === "masuk" ? e.qty : -e.qty;
    if (e.tanggal > row.last) row.last = e.tanggal;
    if (e.arah === "masuk") row.sumber.add(e.sumber);
    map.set(key, row);
  }
  return [...map.values()]
    .map((r) => ({ ...r, qty: Math.round(r.qty * 100) / 100 }))
    .sort((a, b) => a.nama.localeCompare(b.nama) || a.warna.localeCompare(b.warna) || (a.size ?? "").localeCompare(b.size ?? ""));
}
