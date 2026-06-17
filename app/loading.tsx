export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500">Loading DeployForge...</span>
      </div>
    </div>
  );
}
