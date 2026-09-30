"use client";

import { useParams, useRouter } from "next/navigation";
import { FormPageLayout } from "@/components/meetings/FormPageLayout";
import { MeetingForm } from "@/components/meetings/MeetingForm";
import { valuesFromMeeting } from "@/components/meetings/meetingFormState";
import { useCurrentUser } from "@/components/shell/CurrentUser";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

export default function EditMeetingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const toast = useToast();
  const { data: meeting, error } = useAsync(() => api.getMeeting(Number(id)), [id]);

  if (error) {
    return (
      <FormPageLayout title="Edit Meeting">
        <p className="text-muted">{error.message}</p>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout title={meeting ? `Edit "${meeting.topic}"` : "Edit Meeting"}>
      {meeting && user ? (
        <MeetingForm
          existing={meeting}
          initialValues={valuesFromMeeting(meeting)}
          personalMeetingId={user.personal_meeting_id}
          onCancel={() => router.push(`/meetings?id=${meeting.id}`)}
          onSubmit={async (payload) => {
            await api.update(meeting.id, payload);
            toast("Meeting updated");
            router.push(`/meetings?id=${meeting.id}`);
          }}
        />
      ) : (
        <Spinner className="text-zoom-blue" />
      )}
    </FormPageLayout>
  );
}
