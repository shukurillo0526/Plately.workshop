import { cn } from "@/lib/utils";

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  const normalized = category.toLowerCase();
  
  let colors = "bg-gray-500/10 text-gray-400";
  
  if (normalized === "main") colors = "bg-blue-500/10 text-blue-400";
  if (normalized === "appetizer") colors = "bg-amber-500/10 text-amber-400";
  if (normalized === "soup") colors = "bg-purple-500/10 text-purple-400";
  if (normalized === "bread") colors = "bg-orange-500/10 text-orange-400";
  if (normalized === "drink") colors = "bg-cyan-500/10 text-cyan-400";
  if (normalized === "dessert") colors = "bg-pink-500/10 text-pink-400";

  return (
    <span
      className={cn(
        "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full inline-block",
        colors,
        className
      )}
    >
      {category}
    </span>
  );
}
