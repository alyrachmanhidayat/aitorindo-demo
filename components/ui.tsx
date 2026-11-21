export const inputCls =
  "w-full rounded-lg border border-[#e1e0d9] bg-white px-2.5 py-1.5 text-sm tabular-nums outline-none focus:border-[#2a78d6] disabled:bg-[#f4f3f0] disabled:text-[#52514e]";

/** Parses a user-typed number (accepts comma decimals). Returns null for empty / invalid / negative. */
export function parseNum(v: string): number | null {
  if (!v.trim()) return null;
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export const fmt = (x: number, max = 1) => x.toLocaleString("id-ID", { maximumFractionDigits: max });

export function Card({
  title,
  hint,
  right,
  children,
  flush,
}: {
  title?: React.ReactNode;
  hint?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  /** No inner padding (for tables). */
  flush?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e1e0d9] bg-white shadow-sm">
      {(title || right) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e1e0d9] px-5 py-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#0b0b0b]">{title}</h3>}
            {hint && <p className="text-xs text-[#898781]">{hint}</p>}
          </div>
          {right}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function Callout({ tone = "info", children }: { tone?: "info" | "warning"; children: React.ReactNode }) {
  const cls = tone === "warning" ? "bg-[#fef3dc] text-[#8a5a00]" : "bg-[#e9f1fc] text-[#1f5aa8]";
  return <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${cls}`}>{children}</div>;
}

export const th = "px-4 py-2.5 font-medium";
export const td = "px-4 py-2.5";
export const theadRow = "border-b border-[#e1e0d9] text-xs uppercase tracking-wide text-[#898781]";
export const tbodyRow = "border-b border-[#eeede9] last:border-0";
