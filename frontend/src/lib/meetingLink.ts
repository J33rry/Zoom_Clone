/** Parse whatever the user typed into the Join box: a Meeting ID or a full invite link. */
export interface ParsedJoinInput {
  code: string;
  passcode: string | null;
}

export function parseJoinInput(raw: string): ParsedJoinInput | null {
  const input = raw.trim();
  if (!input) return null;

  // Invite links look like https://host/j/81360004521?pwd=AwW2T7
  const linkMatch = input.match(/\/(?:j|wc)\/(\d[\d\s-]{8,})/);
  if (linkMatch) {
    let passcode: string | null = null;
    try {
      passcode = new URL(input.startsWith("http") ? input : `https://${input}`).searchParams.get("pwd");
    } catch {
      passcode = null;
    }
    return { code: linkMatch[1].replace(/\D/g, ""), passcode };
  }

  const digits = input.replace(/[\s-]/g, "");
  if (/^\d{9,11}$/.test(digits)) return { code: digits, passcode: null };
  return null;
}

/** Group digits the way Zoom displays them: 813 6000 4521 / 320 631 3470. */
export function formatMeetingId(code: string): string {
  if (code.length === 11) return `${code.slice(0, 3)} ${code.slice(3, 7)} ${code.slice(7)}`;
  if (code.length === 10) return `${code.slice(0, 3)} ${code.slice(3, 6)} ${code.slice(6)}`;
  return code;
}
