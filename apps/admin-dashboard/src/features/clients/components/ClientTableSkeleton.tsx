export function ClientTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
      ))}
    </div>
  );
}