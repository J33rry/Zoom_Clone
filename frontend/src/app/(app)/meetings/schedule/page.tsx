"use client";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/shell/CurrentUser";
import { FormPageLayout } from "@/components/meetings/FormPageLayout";
import { MeetingForm } from "@/components/meetings/MeetingForm";
import { defaultFormValues } from "@/components/meetings/meetingFormState";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";

export default function ScheduleMeetingPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const toast = useToast();

  return (
    <FormPageLayout title="Schedule Meeting">
      {user ? (
        <MeetingForm
          initialValues={defaultFormValues(user.timezone)}
          personalMeetingId={user.personal_meeting_id}
          onCancel={() => router.push("/meetings")}
          onSubmit={async (payload) => {
            const meeting = await api.schedule(payload);
            toast("Meeting scheduled");
            router.push(`/meetings?id=${meeting.id}`);
          }}
        />
      ) : (
        <Spinner className="text-zoom-blue" />
      )}
    </FormPageLayout>
  );
}
