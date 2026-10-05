export default function Loading() {
  return (
    <div aria-busy className="animate-pulse space-y-8">
      <div className="h-[120px] rounded-2xl bg-surface" />
      <div className="h-6 w-40 rounded-lg bg-surface" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-44 rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
