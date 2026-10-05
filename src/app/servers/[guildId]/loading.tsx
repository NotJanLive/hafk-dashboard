export default function Loading() {
  return (
    <div aria-busy className="animate-pulse">
      <div className="h-3 w-24 rounded bg-surface-3" />
      <div className="mt-3 h-8 w-64 rounded bg-surface-3" />
      <div className="mt-10 h-24 rounded-xl border border-line bg-surface" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-96 rounded-xl border border-line bg-surface" />
        <div className="h-96 rounded-xl border border-line bg-surface" />
      </div>
    </div>
  );
}
