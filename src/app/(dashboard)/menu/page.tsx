"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Plus, Loader2, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuItemCard, MenuItem } from "@/components/menu/menu-item-card";
import { MenuItemModal } from "@/components/menu/menu-item-modal";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { checkTierLimit, type SubscriptionTier } from "@/lib/billing/tiers";

const SAMPLE_MENU: MenuItem[] = [
  { id: "sample-1", name: "Osh (Plov)", price: 35000, category: "Main", description: "Signature rice pilaf with tender beef, yellow carrots, and raisins", is_available: true, is_featured: true },
  { id: "sample-2", name: "Somsa", price: 15000, category: "Appetizer", description: "Clay oven baked pastry with diced beef and cumin", is_available: true, is_featured: false },
  { id: "sample-3", name: "Shashlik (Kebab)", price: 45000, category: "Main", description: "Grilled lamb skewers with pickled onions", is_available: true, is_featured: true },
  { id: "sample-4", name: "Lagman", price: 32000, category: "Soup", description: "Hand-pulled noodle soup with spicy meat and vegetables", is_available: true, is_featured: false },
  { id: "sample-5", name: "Manti", price: 28000, category: "Main", description: "Steamed dumplings served with sour cream", is_available: false, is_featured: false },
  { id: "sample-6", name: "Non (Bread)", price: 5000, category: "Bread", description: "Traditional clay-oven flatbread", is_available: true, is_featured: true },
  { id: "sample-7", name: "Green Tea", price: 8000, category: "Drink", description: "Freshly brewed green tea in national teapot", is_available: true, is_featured: false },
];

export default function MenuPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");

  const restaurantId = user?.restaurant_id;

  const fetchMenuItems = useCallback(async () => {
    if (!restaurantId) {
      // In demo or unattached state, show sample items
      setItems(SAMPLE_MENU);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();

      // Check tier
      const { data: restData } = await supabase
        .from("restaurants")
        .select("subscription_tier")
        .eq("id", restaurantId)
        .single();
      if (restData?.subscription_tier) {
        setSubscriptionTier(restData.subscription_tier as SubscriptionTier);
      }

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Menu] Failed to fetch items from Supabase:", error.message);
        setItems(SAMPLE_MENU);
      } else if (data && data.length > 0) {
        setItems(
          data.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description || "",
            price: row.price,
            category: row.category || "Main",
            image_url: row.image_url || undefined,
            is_available: row.is_available ?? true,
            is_featured: row.is_featured ?? false,
            dietary_tags: row.dietary_tags || [],
          }))
        );
      } else {
        // If the restaurant exists but has 0 items, start with empty list
        setItems([]);
      }
    } catch (err) {
      console.error("[Menu] Unexpected fetch error:", err);
      setItems(SAMPLE_MENU);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
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

  // Toggle availability (In Stock / Out of Stock)
  const handleToggleAvailability = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const nextVal = !item.is_available;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_available: nextVal } : i))
    );

    if (restaurantId && !id.startsWith("sample-")) {
      const supabase = createClient();
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: nextVal })
        .eq("id", id);

      if (error) {
        toast.error("Failed to update availability");
        // Revert
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, is_available: !nextVal } : i))
        );
        return;
      }
    }
    toast.success(`${item.name} marked as ${nextVal ? "in stock" : "out of stock"}`);
  };

  // Toggle featured state
  const handleToggleFeatured = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const nextVal = !item.is_featured;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_featured: nextVal } : i))
    );

    if (restaurantId && !id.startsWith("sample-")) {
      const supabase = createClient();
      const { error } = await supabase
        .from("menu_items")
        .update({ is_featured: nextVal })
        .eq("id", id);

      if (error) {
        toast.error("Failed to update featured status");
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, is_featured: !nextVal } : i))
        );
        return;
      }
    }
  };

  // Delete item
  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    // Optimistic remove
    setItems((prev) => prev.filter((i) => i.id !== id));

    if (restaurantId && !id.startsWith("sample-")) {
      const supabase = createClient();
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete item: " + error.message);
        fetchMenuItems();
        return;
      }
    }
    toast.success(`"${item.name}" deleted`);
  };

  // Open modal for editing
  const handleEdit = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      setEditingItem(item);
      setIsModalOpen(true);
    }
  };

  // Save new or updated item
  const handleSaveItem = async (data: {
    id?: string;
    name: string;
    category: string;
    price: number;
    description: string;
    image_url?: string;
    is_available: boolean;
    is_featured: boolean;
    dietary_tags?: string[];
    prep_time_minutes?: number;
  }) => {
    if (!restaurantId) {
      // Offline/Demo mode: update in memory
      if (data.id) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === data.id
              ? {
                  ...i,
                  ...data,
                }
              : i
          )
        );
        toast.success("Item updated (demo mode)");
      } else {
        const newItem: MenuItem = {
          id: `sample-${Date.now()}`,
          ...data,
        };
        setItems((prev) => [newItem, ...prev]);
        toast.success("Item added (demo mode)");
      }
      return;
    }

    const supabase = createClient();

    if (data.id && !data.id.startsWith("sample-")) {
      // Update in Supabase
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: data.name,
          category: data.category,
          price: data.price,
          description: data.description,
          image_url: data.image_url,
          is_available: data.is_available,
          is_featured: data.is_featured,
          dietary_tags: data.dietary_tags,
          prep_time_minutes: data.prep_time_minutes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (error) {
        toast.error("Failed to update item: " + error.message);
        throw error;
      }
      toast.success("Dish updated successfully!");
    } else {
      // Check tier limit for menu items
      const check = checkTierLimit(subscriptionTier, "menu_items", items.length);
      if (!check.allowed) {
        toast.error(check.message);
        throw new Error(check.message);
      }

      // Insert into Supabase
      const { error } = await supabase.from("menu_items").insert({
        restaurant_id: restaurantId,
        name: data.name,
        category: data.category,
        price: data.price,
        description: data.description,
        image_url: data.image_url,
        is_available: data.is_available,
        is_featured: data.is_featured,
        dietary_tags: data.dietary_tags,
        prep_time_minutes: data.prep_time_minutes,
      });

      if (error) {
        toast.error("Failed to add item: " + error.message);
        throw error;
      }
      toast.success("Dish added to your menu!");
    }

    await fetchMenuItems();
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#0D1117] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">
            Menu Management
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your dishes, prices, and live kitchen availability.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07d21] text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-orange-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D1117] focus:ring-[#f98b25]"
        >
          <Plus className="h-5 w-5" />
          Add Dish
        </button>
      </div>

      {/* Toolbar: Categories & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#161b22] p-4 rounded-xl border border-[rgba(255,255,255,0.06)]">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                  isActive
                    ? "bg-[#1c2333] text-white border-[rgba(255,255,255,0.12)] shadow-sm"
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
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f98b25] focus:border-[#f98b25] transition-colors"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#f98b25] mb-3" />
          <p className="text-sm">Loading your dishes...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        /* Grid */
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
      ) : items.length === 0 ? (
        /* Zero Items Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-[rgba(255,255,255,0.1)] rounded-2xl bg-[#161b22]/40 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1c2333] flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-7 h-7 text-[#f98b25]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Your menu is empty</h3>
          <p className="text-sm text-gray-400 max-w-sm mb-6">
            Get started by adding dishes so guests can view your menu and kitchen staff can fulfill orders.
          </p>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#f98b25] hover:bg-[#e07d21] text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add First Dish
          </button>
        </div>
      ) : (
        /* Search Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl text-center">
          <p className="text-gray-400">
            No dishes matching &quot;{searchQuery}&quot; in {activeCategory}.
          </p>
        </div>
      )}

      {/* Add / Edit Modal */}
      <MenuItemModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={editingItem}
        onSave={handleSaveItem}
      />
    </div>
  );
}
