"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/FormControls";
import { Modal } from "@/components/ui/Modal";

interface RenameDialogProps {
  currentName: string | null;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function RenameDialog({ currentName, onSave, onCancel }: RenameDialogProps) {
  return (
    <Modal open={currentName !== null} onClose={onCancel} title="Rename">
      {currentName !== null && <RenameForm initial={currentName} onSave={onSave} onCancel={onCancel} />}
    </Modal>
  );
}

function RenameForm({ initial, onSave, onCancel }: { initial: string; onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim()) onSave(name.trim());
  };
  return (
    <form onSubmit={submit}>
      <label htmlFor="rename-input" className="mb-2 block text-sm text-ink">
        Enter a new name
      </label>
      <TextInput id="rename-input" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="mt-7 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </form>
  );
}
