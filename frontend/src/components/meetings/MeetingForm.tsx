"use client";

import { CalendarDays, Plus } from "lucide-react";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import { Button } from "@/components/ui/Button";
import { Checkbox, Radio, Select, TextInput } from "@/components/ui/FormControls";
import { useAsync } from "@/hooks/useAsync";
import { useClickOutside } from "@/hooks/useClickOutside";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatMeetingId } from "@/lib/meetingLink";
import type { Meeting, MeetingSettingsInput } from "@/types/api";
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  type MeetingFormValues,
  TIME_OPTIONS,
  toPayload,
  validate,
} from "./meetingFormState";

interface MeetingFormProps {
  initialValues: MeetingFormValues;
  personalMeetingId: string;
  /** Present when editing; shows "Generated ID …" instead of "Generate Automatically". */
  existing?: Meeting;
  onSubmit: (payload: MeetingSettingsInput) => Promise<void>;
  onCancel: () => void;
}

function Row({ label, required, children, className }: { label: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-2 md:grid-cols-[200px_minmax(0,1fr)] md:gap-6", className)}>
      <div className="pt-2 text-[16px] text-ink">
        {required && <span className="mr-1 text-danger">*</span>}
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const Hint = ({ children }: { children: ReactNode }) => (
  <p className="mt-1.5 ml-[30px] text-[15px] text-muted">{children}</p>
);

/** The Schedule Meeting form; the Edit page reuses it unchanged. */
export function MeetingForm({ initialValues, personalMeetingId, existing, onSubmit, onCancel }: MeetingFormProps) {
  const [values, setValues] = useState(initialValues);
  const [showDescription, setShowDescription] = useState(!!initialValues.description);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  useClickOutside(pickerRef, () => setPickerOpen(false), pickerOpen);
  const { data: timezones } = useAsync(() => api.timezones(), []);

  const set = <K extends keyof MeetingFormValues>(key: K, value: MeetingFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = validate(values);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(toPayload(values));
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const { year, month, day } = values.date;
  const dateLabel = `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
  const zoneOptions = timezones ?? [{ id: values.timezone, label: values.timezone }];

  return (
    <form onSubmit={submit} className="max-w-[1080px] space-y-7" noValidate>
      <Row label="Topic" required={!!existing}>
        <TextInput
          value={values.topic}
          onChange={(e) => set("topic", e.target.value)}
          maxLength={200}
          aria-label="Topic"
          className="md:max-w-[620px]"
          autoFocus={!!existing}
          onFocus={(e) => existing && e.currentTarget.select()}
        />
        {showDescription ? (
          <textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Description"
            aria-label="Description"
            rows={3}
            maxLength={5000}
            className="mt-3 block w-full rounded-lg border border-line-strong px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/15 md:max-w-[620px]"
          />
        ) : (
          <button type="button" onClick={() => setShowDescription(true)} className="mt-4 flex items-center gap-1 text-[16px] text-zoom-blue hover:underline">
            <Plus className="h-4 w-4" /> Add Description
          </button>
        )}
      </Row>

      <Row label="When">
        <div className="flex flex-wrap gap-3">
          <div ref={pickerRef} className="relative w-full sm:w-[300px]">
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              aria-label="Meeting date"
              className="flex h-10 w-full items-center justify-between rounded-lg border border-line-strong bg-white px-3.5 text-[15px] text-ink hover:border-[#aeb4bd]"
            >
              {dateLabel}
              <CalendarDays className="h-4 w-4 text-[#4a4f57]" />
            </button>
            {pickerOpen && (
              <div className="absolute top-12 left-0 z-30 animate-fade-in rounded-2xl border border-line bg-white p-5 shadow-popover">
                <MiniCalendar
                  value={new Date(year, month - 1, day)}
                  minDate={existing ? undefined : new Date()}
                  onChange={(d) => {
                    set("date", { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
                    setPickerOpen(false);
                  }}
                />
              </div>
            )}
          </div>
          <Select aria-label="Start time" value={values.time} onChange={(e) => set("time", e.target.value)} className="w-[calc(50%-6px)] sm:w-[210px]">
            {TIME_OPTIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <Select
            aria-label="AM or PM"
            value={values.meridiem}
            onChange={(e) => set("meridiem", e.target.value as "AM" | "PM")}
            className="w-[calc(50%-6px)] sm:w-[130px]"
          >
            <option>AM</option>
            <option>PM</option>
          </Select>
        </div>
      </Row>

      <Row label="Duration">
        <div className="flex items-center gap-3">
          <Select aria-label="Duration hours" value={values.durationHours} onChange={(e) => set("durationHours", Number(e.target.value))} className="w-[140px] sm:w-[190px]">
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </Select>
          <span className="text-[16px] text-ink">hr</span>
          <Select aria-label="Duration minutes" value={values.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} className="w-[140px] sm:w-[190px]">
            {MINUTE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <span className="text-[16px] text-ink">min</span>
        </div>
      </Row>

      <Row label="Time Zone">
        <Select aria-label="Time zone" value={values.timezone} onChange={(e) => set("timezone", e.target.value)} className="md:max-w-[620px]">
          {zoneOptions.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.label}
            </option>
          ))}
        </Select>
      </Row>

      <Row label="Meeting ID">
        <div className="flex flex-wrap gap-x-12 gap-y-3 pt-2">
          <Radio
            name="meeting-id"
            checked={!values.usePmi}
            onChange={() => set("usePmi", false)}
            label={existing && !existing.use_pmi ? `Generated ID ${formatMeetingId(existing.join_code)}` : "Generate Automatically"}
          />
          <Radio
            name="meeting-id"
            checked={values.usePmi}
            onChange={() => set("usePmi", true)}
            label={`Personal Meeting ID ${formatMeetingId(personalMeetingId)}`}
          />
        </div>
      </Row>

      <hr className="border-line" />

      <Row label="Security">
        <div className="pt-1.5">
          <div className="flex flex-wrap items-center gap-4">
            <Checkbox
              label="Passcode"
              checked={values.passcodeEnabled}
              disabled={values.usePmi}
              onChange={(e) => set("passcodeEnabled", e.target.checked)}
            />
            {values.passcodeEnabled && !values.usePmi && (
              <TextInput
                aria-label="Passcode"
                value={values.passcode}
                maxLength={10}
                onChange={(e) => set("passcode", e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
                className="w-[240px]"
              />
            )}
          </div>
          <Hint>
            {values.usePmi
              ? "Uses the passcode of your Personal Meeting Room"
              : "Only users who have the invite link or passcode can join the meeting"}
          </Hint>
          <div className="mt-5">
            <Checkbox label="Waiting Room" checked={values.waitingRoom} onChange={(e) => set("waitingRoom", e.target.checked)} />
            <Hint>Only users admitted by the host can join the meeting</Hint>
          </div>
        </div>
      </Row>

      <Row label="Video">
        <div className="grid max-w-[400px] grid-cols-[120px_80px_80px] items-center gap-y-4 pt-2 text-[16px] text-ink">
          <span>Host</span>
          <Radio name="host-video" label="on" checked={values.hostVideo} onChange={() => set("hostVideo", true)} />
          <Radio name="host-video" label="off" checked={!values.hostVideo} onChange={() => set("hostVideo", false)} />
          <span>Participant</span>
          <Radio name="participant-video" label="on" checked={values.participantVideo} onChange={() => set("participantVideo", true)} />
          <Radio name="participant-video" label="off" checked={!values.participantVideo} onChange={() => set("participantVideo", false)} />
        </div>
      </Row>

      {error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-4 pt-2 pb-6">
        <Button type="submit" size="lg" disabled={saving} className="min-w-[96px]">
          Save
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel} className="min-w-[96px]">
          Close
        </Button>
      </div>
    </form>
  );
}
