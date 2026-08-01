"use client";

import { ImageIcon, Pencil, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { StockToggle } from "./stock-toggle";
import { CategoryBadge } from "./category-badge";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  dietary_tags?: string[];
}

interface MenuItemCardProps {
  item: MenuItem;
  onToggleAvailability: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MenuItemCard({
  item,
  onToggleAvailability,
  onToggleFeatured,
  onEdit,
  onDelete,
}: MenuItemCardProps) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#161b22] hover:border-[rgba(255,255,255,0.12)] hover:-translate-y-[1px] transition-all overflow-hidden">
      {/* Image Placeholder */}
      <div className="relative h-[160px] w-full bg-[#1c2333] flex items-center justify-center shrink-0">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-10 w-10 text-gray-600" />
        )}

        {/* Featured Toggle inside image area */}
        <button
          type="button"
          onClick={() => onToggleFeatured(item.id)}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-[#0D1117]/60 hover:bg-[#0D1117]/80 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#f98b25]"
        >
          <Star
            className={cn("h-5 w-5 transition-colors", item.is_featured ? "fill-yellow-400 text-yellow-400" : "text-gray-400")}
          />
        </button>

        {/* Action Buttons overlay on hover */}
        <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(item.id)}
            className="p-1.5 rounded-full bg-blue-500/80 hover:bg-blue-600/90 text-white backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#f98b25]"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-600/90 text-white backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#f98b25]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-semibold text-white truncate font-[family-name:var(--font-display)]">{item.name}</h3>
          <CategoryBadge category={item.category} className="shrink-0" />
        </div>
        
        <p className="text-xs text-gray-500 truncate mb-4">{item.description}</p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="font-medium text-white font-[family-name:var(--font-mono)]">
            {new Intl.NumberFormat("en-US").format(item.price)} soʻm
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{item.is_available ? "In stock" : "Out"}</span>
            <StockToggle
              checked={item.is_available}
              onChange={() => onToggleAvailability(item.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
