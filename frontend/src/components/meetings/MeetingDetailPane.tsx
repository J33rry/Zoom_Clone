"use client";

import { ChevronLeft, Copy, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useStartMeeting } from "@/hooks/useStartMeeting";
import { api } from "@/lib/api";
import { formatMeetingId } from "@/lib/meetingLink";
import { formatFullRange, formatLongDate } from "@/lib/time";
import type { Meeting } from "@/types/api";

interface MeetingDetailPaneProps {
  meeting: Meeting;
  onDeleted: () => void;
  onBack: () => void;
}

export function MeetingDetailPane({ meeting, onDeleted, onBack }: MeetingDetailPaneProps) {
  const toast = useToast();
  const { startMeeting, starting } = useStartMeeting();
  const [showInvitation, setShowInvitation] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isRecent = meeting.status === "ended" || (meeting.status !== "live" && new Date(meeting.end_time) < new Date());
  const canStart = !(meeting.meeting_type === "instant" && meeting.status === "ended");
  const canEdit = meeting.meeting_type === "scheduled" && !isRecent;
  const canDelete = meeting.meeting_type !== "personal";

  const start = new Date(isRecent && meeting.started_at ? meeting.started_at : meeting.start_time);
  const end = new Date(isRecent && meeting.ended_at ? meeting.ended_at : meeting.end_time);

  const copyInvitation = async () => {
    try {
      await navigator.clipboard.writeText(meeting.invitation);
      toast("Meeting invitation copied to clipboard");
    } catch {
      toast("Could not access the clipboard", "error");
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.remove(meeting.id);
      toast("Meeting deleted");
      setConfirmDelete(false);
      onDeleted();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-8 md:px-11 md:py-12">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-[15px] text-zoom-blue md:hidden">
        <ChevronLeft className="h-4 w-4" /> Meetings
      </button>
      <h1 className="text-[27px] font-semibold tracking-[-0.01em] text-ink-2">{meeting.topic}</h1>
      <div className="mt-8 space-y-4 text-[15px] text-ink-2">
        {isRecent && <p>{formatLongDate(start)}</p>}
        <p>{formatFullRange(start, end)}</p>
        <p>Host: {meeting.host.name}</p>
        <p>Meeting ID: {formatMeetingId(meeting.join_code)}</p>
        {meeting.description && <p className="whitespace-pre-line text-muted">{meeting.description}</p>}
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        {canStart && (
          <Button onClick={() => startMeeting(meeting)} disabled={starting} className="min-w-[82px] rounded-md">
            Start
          </Button>
        )}
        <Button variant="outline" onClick={copyInvitation} className="rounded-md">
          <Copy className="h-4 w-4" /> Copy Invitation
        </Button>
        {canEdit && (
          <Link
            href={`/meetings/${meeting.id}/edit`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong px-4 text-sm font-semibold text-ink hover:bg-hover"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        )}
        {canDelete && (
          <Button variant="outline" onClick={() => setConfirmDelete(true)} className="rounded-md">
            <X className="h-4 w-4" /> Delete
          </Button>
        )}
      </div>

      <button onClick={() => setShowInvitation((s) => !s)} className="mt-14 text-[15px] text-zoom-blue hover:underline">
        {showInvitation ? "Hide Meeting Invitation" : "Show Meeting Invitation"}
      </button>
      {showInvitation && (
        <pre className="mt-4 font-sans text-[15px] leading-[21px] whitespace-pre-wrap break-all text-ink-2">{meeting.invitation}</pre>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete meeting?"
        message={`"${meeting.topic}" will be removed from your meetings. People with the invite link will no longer be able to join.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
