"use client";

import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuItemCard, MenuItem } from "@/components/menu/menu-item-card";

const SAMPLE_MENU: MenuItem[] = [
  { id: "1", name: "Osh (Plov)", price: 35000, category: "Main", description: "Signature rice pilaf", is_available: true, is_featured: true },
  { id: "2", name: "Somsa", price: 15000, category: "Appetizer", description: "Baked pastry with meat", is_available: true, is_featured: false },
  { id: "3", name: "Shashlik (Kebab)", price: 45000, category: "Main", description: "Grilled meat skewers", is_available: true, is_featured: true },
  { id: "4", name: "Lagman", price: 32000, category: "Soup", description: "Hand-pulled noodle soup", is_available: true, is_featured: false },
  { id: "5", name: "Manti", price: 28000, category: "Main", description: "Steamed dumplings", is_available: false, is_featured: false },
  { id: "6", name: "Non (Bread)", price: 5000, category: "Bread", description: "Traditional flatbread", is_available: true, is_featured: true },
  { id: "7", name: "Chuchvara", price: 22000, category: "Soup", description: "Tiny dumplings in broth", is_available: true, is_featured: false },
  { id: "8", name: "Samsa", price: 18000, category: "Appetizer", description: "Flaky baked pastry", is_available: true, is_featured: false },
  { id: "9", name: "Dimlama", price: 38000, category: "Main", description: "Slow-cooked meat with vegetables", is_available: true, is_featured: false },
  { id: "10", name: "Green Tea", price: 8000, category: "Drink", description: "Traditional green tea", is_available: true, is_featured: false },
  { id: "11", name: "Compot", price: 12000, category: "Drink", description: "Fruit compote", is_available: true, is_featured: false },
  { id: "12", name: "Halva", price: 15000, category: "Dessert", description: "Traditional halva", is_available: true, is_featured: false },
];

const CATEGORIES = ["All", "Main", "Appetizer", "Soup", "Bread", "Drink", "Dessert"];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(SAMPLE_MENU);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, searchQuery, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    items.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  const handleToggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_available: !item.is_available } : item
      )
    );
  };

  const handleToggleFeatured = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_featured: !item.is_featured } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEdit = (id: string) => {
    console.log("Edit item", id);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#0D1117] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">Menu Management</h1>
          <p className="text-gray-400 mt-1">Manage your dishes, prices, and availability.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07d21] text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D1117] focus:ring-[#f98b25]">
          <Plus className="h-5 w-5" />
          Add Item
        </button>
      </div>

      {/* Toolbar: Categories & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#161b22] p-4 rounded-xl border border-[rgba(255,255,255,0.06)]">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                  isActive
                    ? "bg-[#1c2333] text-white border-[rgba(255,255,255,0.12)]"
                    : "text-gray-400 border-transparent hover:text-gray-200 hover:bg-[#1c2333]/50"
                )}
              >
                {cat} <span className="opacity-50 ml-1">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1c2333] border border-[rgba(255,255,255,0.06)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f98b25] focus:border-[#f98b25] transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onToggleAvailability={handleToggleAvailability}
              onToggleFeatured={handleToggleFeatured}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-[rgba(255,255,255,0.12)] rounded-xl">
          <p className="text-gray-400 text-center">No menu items found for &quot;{searchQuery}&quot;.</p>
        </div>
      )}

      {/* Bottom Note */}
      <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center">
        <p className="text-sm text-gray-500">AI-powered menu OCR coming soon • Phase 2</p>
      </div>
    </div>
  );
}
