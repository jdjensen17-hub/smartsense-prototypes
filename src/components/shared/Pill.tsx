export function Pill({ label }: { label: string }) {
  if (label === 'Custom') {
    return (
      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-600">
        {label}
      </span>
    );
  }
  return (
    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </span>
  );
}