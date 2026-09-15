export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-[#dce8ef]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-[#dce8ef]" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-[#dce8ef]" />
    </div>
  );
}