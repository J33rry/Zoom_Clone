"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PreJoin } from "@/components/meetings/PreJoin";

function JoinView() {
  const { code } = useParams<{ code: string }>();
  const params = useSearchParams();
  return <PreJoin code={code} initialPasscode={params.get("pwd") ?? ""} />;
}

/** Invite-link landing page: /j/81360004521?pwd=AwW2T7 */
export default function JoinPage() {
  return (
    <Suspense>
      <JoinView />
    </Suspense>
  );
}
