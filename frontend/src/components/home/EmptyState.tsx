/** Beach-umbrella illustration from the "No meetings scheduled." state. */
export function EmptyState({ text = "No meetings scheduled." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <svg viewBox="0 0 120 100" className="h-[92px] w-[110px]" aria-hidden>
        <ellipse cx="60" cy="86" rx="40" ry="9" fill="#EEF0F8" />
        <path d="M44 78h36l6-9H50z" fill="#C9CEEA" />
        <path d="M47 74h34M49 71.5h34" stroke="#9FA6D4" strokeWidth="1.2" />
        <path d="M61 28 55 84" stroke="#8C93C9" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22 30C34 14 64 8 86 22L61 30z" fill="#A8AEDC" />
        <path d="M22 30c10-4 22-4 39 0 10-5 18-7 25-8" fill="none" stroke="#8C93C9" strokeWidth="1.5" />
        <path d="M61 30C56 18 57 12 60 9" fill="none" stroke="#C3C8EB" strokeWidth="2" />
      </svg>
      <p className="text-[15px] text-[#4a4f57]">{text}</p>
    </div>
  );
}
