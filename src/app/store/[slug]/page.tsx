"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  UtensilsCrossed,
  Search,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { formatUZS } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StoreMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  dietary_tags?: string[];
  prep_time_minutes?: number;
}

interface CartItem {
  item: StoreMenuItem;
  quantity: number;
}

const DEMO_ITEMS: StoreMenuItem[] = [
  {
    id: "demo-1",
    name: "To'y Oshi (Wedding Plov)",
    description: "Signature Uzbek rice pilaf with tender slow-cooked beef, yellow carrots, and raisins.",
    price: 38000,
    category: "Main Dishes",
    dietary_tags: ["Halal"],
    prep_time_minutes: 15,
  },
  {
    id: "demo-2",
    name: "Tandir Somsa",
    description: "Flaky clay-oven pastry with hand-cut beef, sweet onions, and roasted cumin.",
    price: 16000,
    category: "Appetizers",
    dietary_tags: ["Halal"],
    prep_time_minutes: 10,
  },
  {
    id: "demo-3",
    name: "Uygur Lagman",
    description: "Fresh hand-pulled noodles with savory beef slices, bell peppers, and rich tomato broth.",
    price: 36000,
    category: "Main Dishes",
    dietary_tags: ["Halal"],
    prep_time_minutes: 15,
  },
  {
    id: "demo-4",
    name: "Kebab Shashlik (Lamb)",
    description: "Tender lamb skewers charcoal-grilled to perfection, served with marinated white onion.",
    price: 46000,
    category: "Main Dishes",
    dietary_tags: ["Halal", "Gluten-Free"],
    prep_time_minutes: 20,
  },
  {
    id: "demo-5",
    name: "Issiq Tandir Non",
    description: "Freshly baked traditional flatbread directly from the tandoor.",
    price: 5000,
    category: "Bakery",
    dietary_tags: ["Halal", "Vegetarian"],
    prep_time_minutes: 5,
  },
  {
    id: "demo-6",
    name: "Ko'k Choy (Traditional Green Tea)",
    description: "Authentic fragrant green tea served in a traditional hand-painted teapot.",
    price: 8000,
    category: "Drinks",
    dietary_tags: ["Halal", "Vegan", "Gluten-Free"],
    prep_time_minutes: 5,
  },
];

export default function PublicStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [restaurant, setRestaurant] = useState<{
    id: string;
    name: string;
    cuisine: string;
    phone: string;
    address: string;
  }>({
    id: "demo-rest",
    name: "Tashkent Palace Restaurant",
    cuisine: "Uzbek Traditional",
    phone: "+998 90 123 45 67",
    address: "Amir Timur Street 24, Tashkent",
  });

  const [menuItems, setMenuItems] = useState<StoreMenuItem[]>(DEMO_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart & Checkout
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+998 ");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    async function loadStorefront() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // 1. Fetch restaurant
        const { data: rest, error: restErr } = await supabase
          .from("restaurants")
          .select("*")
          .eq("slug", slug)
          .single();

        if (!restErr && rest) {
          setRestaurant({
            id: rest.id,
            name: rest.name,
            cuisine: rest.cuisine_type || "National Cuisine",
            phone: rest.phone || "+998 90 123 45 67",
            address: rest.address || "Tashkent, Uzbekistan",
          });

          // 2. Fetch active dishes
          const { data: items } = await supabase
            .from("menu_items")
            .select("*")
            .eq("restaurant_id", rest.id)
            .eq("is_available", true)
            .order("created_at", { ascending: false });

          if (items && items.length > 0) {
            setMenuItems(
              items.map((row) => ({
                id: row.id,
                name: row.name,
                description: row.description || "",
                price: row.price,
                category: row.category || "Dishes",
                image_url: row.image_url,
                dietary_tags: row.dietary_tags || [],
                prep_time_minutes: row.prep_time_minutes || 15,
              }))
            );
          }
        }
      } catch (err) {
        console.warn("[Storefront] Error loading storefront:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStorefront();
  }, [slug]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    menuItems.forEach((i) => i.category && set.add(i.category));
    return Array.from(set);
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = activeCategory === "All" || item.category === activeCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Cart actions
  const addToCart = (item: StoreMenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const nextQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item.id]: { item, quantity: nextQty },
      };
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((acc, c) => acc + c.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return Object.values(cart).reduce((acc, c) => acc + c.item.price * c.quantity, 0);
  }, [cart]);

  const deliveryFee = orderType === "delivery" ? 15000 : 0;
  const orderTotal = cartSubtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Please provide your name and phone number");
      return;
    }
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      toast.error("Please provide a delivery address");
      return;
    }

    setIsSubmittingOrder(true);
    const orderNum = `PLT-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      if (restaurant.id !== "demo-rest") {
        const supabase = createClient();
        const orderItemsPayload = Object.values(cart).map((c) => ({
          menu_item_id: c.item.id,
          name: c.item.name,
          quantity: c.quantity,
          unit_price: c.item.price,
          total_price: c.item.price * c.quantity,
        }));

        await supabase.from("orders").insert({
          restaurant_id: restaurant.id,
          order_number: orderNum,
          customer_name: customerName.trim(),
          phone: customerPhone.trim(),
          delivery_address: orderType === "delivery" ? deliveryAddress.trim() : null,
          type: orderType,
          status: "confirmed",
          subtotal: cartSubtotal,
          delivery_fee: deliveryFee,
          total: orderTotal,
          items: orderItemsPayload,
        });
      }

      setConfirmedOrderNumber(orderNum);
      setCart({});
      setIsCheckoutOpen(false);
      toast.success("Order placed successfully! Kitchen is preparing your food.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to place order");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white flex flex-col font-[family-name:var(--font-sans)]">
      {/* Top Banner / Restaurant Info */}
      <header className="border-b border-[rgba(255,255,255,0.08)] bg-[#161b22] sticky top-0 z-30 shadow-xl backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f98b25] to-[#e07a00] flex items-center justify-center font-bold text-white shadow-md shadow-orange-500/20 font-[family-name:var(--font-display)]">
              {restaurant.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold font-[family-name:var(--font-display)] leading-tight text-white">
                {restaurant.name}
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <span>{restaurant.cuisine}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Open Now</span>
              </p>
            </div>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#f98b25] hover:bg-[#e07b1d] text-white font-medium text-xs transition-all shadow-lg shadow-orange-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            {totalCartCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/30 font-mono text-[11px] font-bold">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#161b22] to-[#0D1117] border-b border-[rgba(255,255,255,0.06)] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#f98b25] font-semibold">
              Direct Online Ordering
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] text-white">
              Order fresh food straight from the kitchen
            </h2>
            <p className="text-xs text-gray-400 flex flex-wrap items-center gap-4 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#f98b25]" /> {restaurant.address}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#f98b25]" /> {restaurant.phone}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Avg. Prep: 15-20 min
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Category Tabs & Menu Grid */}
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1 space-y-6">
        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-[#161b22] p-3 rounded-2xl border border-[rgba(255,255,255,0.06)]">
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-[#f98b25] text-white shadow-md shadow-orange-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f98b25]"
            />
          </div>
        </div>

        {/* Menu Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#f98b25] mb-2" />
            <p className="text-xs">Loading delicious menu...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const inCart = cart[item.id]?.quantity || 0;

              return (
                <div
                  key={item.id}
                  className="bg-[#161b22] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] rounded-2xl p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-xl group"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-white text-base font-[family-name:var(--font-display)]">
                        {item.name}
                      </h3>
                      <span className="text-[10px] text-gray-400 bg-[#0D1117] px-2 py-0.5 rounded-full border border-white/5">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {item.dietary_tags && item.dietary_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.dietary_tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-[#34d399] bg-[#34d399]/10 px-2 py-0.5 rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-5 mt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                    <span className="text-base font-bold font-[family-name:var(--font-mono)] text-[#f98b25]">
                      {formatUZS(item.price)}
                    </span>

                    {inCart > 0 ? (
                      <div className="flex items-center gap-2 bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl p-1">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold px-1">{inCart}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#f98b25] text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#f98b25] text-gray-200 hover:text-white transition-all text-xs font-medium border border-white/5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500 text-xs">
            No dishes found matching your search.
          </div>
        )}
      </main>

      {/* Floating Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#161b22] border-l border-[rgba(255,255,255,0.08)] h-full overflow-y-auto p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#f98b25]" />
                  <h3 className="font-bold text-white text-base">Your Order</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-3">
                {Object.values(cart).length > 0 ? (
                  Object.values(cart).map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#0D1117] rounded-xl border border-[rgba(255,255,255,0.06)] flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {formatUZS(item.price * quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-[#161b22] rounded-lg p-1 border border-white/5">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold px-1">{quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-[#f98b25] text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    Your cart is empty. Add dishes from the menu to start!
                  </div>
                )}
              </div>
            </div>

            {/* Cart Footer */}
            {totalCartCount > 0 && (
              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="font-mono font-bold">{formatUZS(cartSubtotal)}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f98b25] to-[#e07a00] text-white font-bold text-xs shadow-lg shadow-orange-500/20 hover:brightness-110 transition-all"
                >
                  Proceed to Checkout ({formatUZS(cartSubtotal)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md bg-[#161b22] border-[rgba(255,255,255,0.08)] text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-[family-name:var(--font-display)]">
              Complete Your Order
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePlaceOrder} className="space-y-4 py-2 text-xs">
            <div className="flex gap-2 p-1 bg-[#0D1117] rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  orderType === "delivery"
                    ? "bg-[#f98b25] text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Delivery (+15,000 soʻm)
              </button>
              <button
                type="button"
                onClick={() => setOrderType("pickup")}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  orderType === "pickup"
                    ? "bg-[#f98b25] text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Pickup (Free)
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-gray-300">Your Full Name *</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Alisher Navoiy"
                required
                className="bg-[#0D1117] border-white/10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-gray-300">Phone Number (Tashkent) *</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                required
                className="bg-[#0D1117] border-white/10 text-xs font-mono"
              />
            </div>

            {orderType === "delivery" && (
              <div className="space-y-1">
                <Label className="text-gray-300">Delivery Street Address *</Label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Yunusabad 19, Apt 4"
                  required
                  className="bg-[#0D1117] border-white/10 text-xs"
                />
              </div>
            )}

            <div className="p-3 bg-[#0D1117] rounded-xl border border-white/5 space-y-1.5 font-mono">
              <div className="flex justify-between text-gray-400">
                <span>Items:</span>
                <span>{formatUZS(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery:</span>
                <span>{formatUZS(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/5">
                <span>Total:</span>
                <span className="text-[#f98b25]">{formatUZS(orderTotal)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f98b25] to-[#e07a00] text-white font-bold text-xs shadow-lg shadow-orange-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending to Kitchen...
                  </>
                ) : (
                  `Place Order (${formatUZS(orderTotal)})`
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      {confirmedOrderNumber && (
        <Dialog
          open={!!confirmedOrderNumber}
          onOpenChange={() => setConfirmedOrderNumber(null)}
        >
          <DialogContent className="max-w-md bg-[#161b22] border-[rgba(255,255,255,0.08)] text-white p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-[family-name:var(--font-display)]">
              Order Received!
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Your order is with the kitchen. We will prepare it right away.
            </p>
            <div className="my-4 p-3 bg-[#0D1117] rounded-xl font-mono text-sm font-bold text-[#f98b25]">
              Order ID: #{confirmedOrderNumber}
            </div>
            <button
              onClick={() => setConfirmedOrderNumber(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
            >
              Back to Menu
            </button>
          </DialogContent>
        </Dialog>
      )}

      {/* Storefront Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] py-6 text-center text-xs text-gray-500">
        Powered by{" "}
        <span className="text-[#f98b25] font-semibold font-[family-name:var(--font-display)]">
          Plately Workshop
        </span>{" "}
        • Direct Ordering Platform
      </footer>
    </div>
  );
}
