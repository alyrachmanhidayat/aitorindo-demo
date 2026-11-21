import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { PoStoreProvider } from "@/lib/po-store";

/**
 * App shell: the viewport height is fixed, so the sidebar and topbar stay in place
 * and only <main> scrolls. Print falls back to normal document flow.
 */
export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PoStoreProvider>
      <div className="flex h-dvh overflow-hidden bg-[#f9f9f7] print:block print:h-auto print:overflow-visible print:bg-white">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 print:overflow-visible print:p-0">{children}</main>
        </div>
      </div>
    </PoStoreProvider>
  );
}
