import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Skeleton className="h-[420px]" />
      <Skeleton className="h-[420px]" />
    </div>
  );
}
