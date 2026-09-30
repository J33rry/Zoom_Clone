/** Renders invitation text with its URLs turned into links. */
export function InvitationText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      {text.split("\n").map((line, i) =>
        line.trim() === "" ? (
          <div key={i} className="h-3" />
        ) : /^https?:\/\//.test(line) ? (
          <a key={i} href={line} className="block break-all text-zoom-blue hover:underline" target="_blank" rel="noreferrer">
            {line}
          </a>
        ) : (
          <p key={i}>{line}</p>
        ),
      )}
    </div>
  );
}
