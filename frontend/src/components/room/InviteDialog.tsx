"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatMeetingId } from "@/lib/meetingLink";
import type { Meeting } from "@/types/api";

interface InviteDialogProps {
  meeting: Meeting | undefined;
  open: boolean;
  onClose: () => void;
  onCopy: (text: string, what: string) => void;
}

/** "Invite…" from the Participants menu: the details people need to join, ready to copy. */
export function InviteDialog({ meeting, open, onClose, onCopy }: InviteDialogProps) {
  return (
    <Modal open={open && !!meeting} onClose={onClose} title="Invite people to join meeting">
      {meeting && (
        <>
          <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-3 text-sm">
            <dt className="text-muted">Meeting ID</dt>
            <dd className="text-ink">{formatMeetingId(meeting.join_code)}</dd>
            {meeting.passcode && (
              <>
                <dt className="text-muted">Passcode</dt>
                <dd className="text-ink">{meeting.passcode}</dd>
              </>
            )}
            <dt className="text-muted">Invite link</dt>
            <dd className="break-all text-zoom-blue">{meeting.invite_link}</dd>
          </dl>
          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => onCopy(meeting.invite_link, "Invite link")}>
              Copy Invite Link
            </Button>
            <Button
              onClick={() => {
                onCopy(meeting.invitation, "Invitation");
                onClose();
              }}
            >
              Copy Invitation
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
