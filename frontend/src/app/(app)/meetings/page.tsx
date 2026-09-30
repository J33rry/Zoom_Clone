"use client";

import { Video } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MeetingDetailPane } from "@/components/meetings/MeetingDetailPane";
import { MeetingList, type MeetingsTab } from "@/components/meetings/MeetingList";
import { useCurrentUser } from "@/components/shell/CurrentUser";
import { Spinner } from "@/components/ui/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

function MeetingsView() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useCurrentUser();
  const tab: MeetingsTab = params.get("tab") === "recent" ? "recent" : "upcoming";
  const idParam = params.get("id");

  const { data: meetings, loading, reload } = useAsync(() => (tab === "recent" ? api.recent() : api.upcoming()), [tab]);

  const setQuery = (next: { tab?: MeetingsTab; id?: number | null }) => {
    const query = new URLSearchParams();
    const nextTab = next.tab ?? tab;
    if (nextTab === "recent") query.set("tab", "recent");
    if (next.id) query.set("id", String(next.id));
    router.replace(`/meetings${query.size ? `?${query}` : ""}`, { scroll: false });
  };

  // Desktop shows the first meeting when nothing is selected; phones show the list instead.
  const selected = meetings?.find((m) => String(m.id) === idParam) ?? meetings?.[0] ?? null;

  return (
    <div className="flex h-full">
      <aside className={cn("w-full shrink-0 border-r border-line md:block md:w-[340px] lg:w-[400px]", idParam ? "hidden" : "block")}>
        <MeetingList
          tab={tab}
          onTabChange={(t) => setQuery({ tab: t, id: null })}
          meetings={meetings}
          loading={loading}
          selectedId={selected?.id ?? null}
          onSelect={(m) => setQuery({ id: m.id })}
          onRefresh={reload}
          personalMeetingId={user?.personal_meeting_id}
        />
      </aside>
      <section className={cn("min-w-0 flex-1 md:block", idParam ? "block" : "hidden")}>
        {selected ? (
          <MeetingDetailPane
            key={selected.id}
            meeting={selected}
            onBack={() => setQuery({ id: null })}
            onDeleted={() => {
              setQuery({ id: null });
              reload();
            }}
          />
        ) : loading ? null : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
            <Video className="h-10 w-10 text-line-strong" />
            <p>Select a meeting to see its details</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-zoom-blue">
          <Spinner />
        </div>
      }
    >
      <MeetingsView />
    </Suspense>
  );
}
