import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function FormPageLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 pt-7 pb-10 md:px-10">
        <Link href="/meetings" className="inline-flex items-center gap-1 text-[16px] text-zoom-blue hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to Meetings
        </Link>
        <h1 className="mt-5 mb-8 text-[28px] font-bold tracking-[-0.01em] text-ink">{title}</h1>
        {children}
      </div>
    </div>
  );
}
