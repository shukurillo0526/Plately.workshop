"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { MenuItem } from "./menu-item-card";

const DEFAULT_CATEGORIES = ["Main", "Appetizer", "Soup", "Bread", "Drink", "Dessert"];
const DIETARY_OPTIONS = ["Halal", "Vegetarian", "Vegan", "Gluten-Free"];

interface MenuItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  onSave: (data: {
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
  }) => Promise<void>;
}

export function MenuItemModal({
  open,
  onOpenChange,
  item,
  onSave,
}: MenuItemModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Main");
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState("15");
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be under 10MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const supabase = createClient();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${user?.restaurant_id || "general"}/${Date.now()}-${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-items")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("menu-items")
        .getPublicUrl(filePath);

      setImageUrl(publicData.publicUrl);
      toast.success("Dish photo uploaded successfully!");
    } catch (err: any) {
      console.error("Storage upload error:", err);
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAIGenerate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a dish name first");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/ai/describe-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category === "Custom" ? customCategory : category,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDescription(data.description);
        if (Array.isArray(data.suggestedDietary) && data.suggestedDietary.length > 0) {
          setSelectedDietary((prev) => Array.from(new Set([...prev, ...data.suggestedDietary])));
        }
        if (data.prepTimeMinutes) {
          setPrepTimeMinutes(String(data.prepTimeMinutes));
        }
        toast.success("AI draft generated! Review before saving.");
      } else {
        throw new Error(data.error || "Failed to generate description");
      }
    } catch (err: any) {
      toast.error(err?.message || "AI generation failed");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      const isKnownCategory = DEFAULT_CATEGORIES.includes(item.category);
      setCategory(isKnownCategory ? item.category : "Custom");
      setCustomCategory(isKnownCategory ? "" : item.category);
      setPrice(item.price ? item.price.toString() : "");
      setDescription(item.description || "");
      setImageUrl(item.image_url || "");
      setIsAvailable(item.is_available ?? true);
      setIsFeatured(item.is_featured ?? false);
      setSelectedDietary(item.dietary_tags || []);
    } else {
      setName("");
      setCategory("Main");
      setCustomCategory("");
      setPrice("");
      setDescription("");
      setImageUrl("");
      setIsAvailable(true);
      setIsFeatured(false);
      setPrepTimeMinutes("15");
      setSelectedDietary([]);
    }
  }, [item, open]);

  const toggleDietary = (tag: string) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPrice = parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
    const finalCategory = category === "Custom" ? customCategory.trim() || "Main" : category;

    setIsSubmitting(true);
    try {
      await onSave({
        id: item?.id,
        name: name.trim(),
        category: finalCategory,
        price: parsedPrice,
        description: description.trim(),
        image_url: imageUrl.trim() || undefined,
        is_available: isAvailable,
        is_featured: isFeatured,
        dietary_tags: selectedDietary,
        prep_time_minutes: parseInt(prepTimeMinutes, 10) || 15,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#161b22] border-[rgba(255,255,255,0.08)] text-white p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-[family-name:var(--font-display)]">
            {item ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-name" className="text-xs text-gray-300">
                Item Name *
              </Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Osh (Plov)"
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-category" className="text-xs text-gray-300">
                Category *
              </Label>
              <select
                id="item-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md bg-[#0D1117] border border-[rgba(255,255,255,0.08)] px-3 text-sm text-white focus:outline-none focus:border-[#f98b25]"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Custom">+ Custom Category</option>
              </select>
            </div>
          </div>

          {category === "Custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="custom-category" className="text-xs text-gray-300">
                Custom Category Name
              </Label>
              <Input
                id="custom-category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Traditional Drinks"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
          )}

          {/* Price & Prep Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-price" className="text-xs text-gray-300">
                Price (UZS) *
              </Label>
              <Input
                id="item-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 35000"
                required
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-prep" className="text-xs text-gray-300">
                Prep Time (minutes)
              </Label>
              <Input
                id="item-prep"
                type="number"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                placeholder="15"
                className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="item-desc" className="text-xs text-gray-300">
                Description
              </Label>
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={isGeneratingAI || !name.trim()}
                className="flex items-center gap-1.5 text-[11px] text-[#f98b25] hover:text-[#e07a00] disabled:opacity-40 transition-colors font-medium"
                title={name.trim() ? "Generate AI description" : "Enter a dish name first"}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGeneratingAI ? "Drafting..." : "✨ AI Suggest"}
              </button>
            </div>
            <Textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short appetizing description of the dish..."
              rows={2}
              className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25] resize-none"
            />
          </div>

          {/* Dish Image Upload & Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-300">Dish Photo</Label>
              <button
                type="button"
                onClick={() => setShowManualUrl(!showManualUrl)}
                className="text-[11px] text-gray-400 hover:text-white transition-colors underline"
              >
                {showManualUrl ? "Hide URL input" : "Or enter direct URL"}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
            />

            {imageUrl ? (
              <div className="flex items-center gap-3 p-3 bg-[#0D1117] rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/40 shrink-0 border border-white/5 relative">
                  <img
                    src={imageUrl}
                    alt="Dish preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">Photo attached</p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{imageUrl}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="text-[11px] text-[#f98b25] hover:underline font-medium"
                    >
                      {isUploadingImage ? "Uploading..." : "Replace photo"}
                    </button>
                    <span className="text-gray-600 text-xs">•</span>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-[11px] text-red-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isUploadingImage
                    ? "border-[#f98b25]/50 bg-[#f98b25]/5 cursor-wait"
                    : "border-[rgba(255,255,255,0.1)] hover:border-[#f98b25]/50 bg-[#0D1117]/50 hover:bg-[#0D1117]"
                }`}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-[#f98b25] mb-2" />
                    <p className="text-xs font-medium text-white">Uploading to cloud storage...</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Please wait a moment</p>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#f98b25] mb-2">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium text-white">
                      Click to upload dish photo
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      PNG, JPG, or WebP up to 10MB
                    </p>
                  </>
                )}
              </div>
            )}

            {showManualUrl && (
              <div className="pt-2 animate-in fade-in duration-150">
                <Input
                  id="item-image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/photos/plov.jpg"
                  className="bg-[#0D1117] border-[rgba(255,255,255,0.08)] focus:border-[#f98b25] text-xs"
                />
              </div>
            )}
          </div>

          {/* Dietary Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-300">Dietary Tags</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {DIETARY_OPTIONS.map((tag) => {
                const isSelected = selectedDietary.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDietary(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-[#f98b25]/20 text-[#f98b25] border-[#f98b25]/40"
                        : "bg-[#0D1117] text-gray-400 border-[rgba(255,255,255,0.08)] hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2">
              <Switch
                id="is-available"
                checked={isAvailable}
                onCheckedChange={setIsAvailable}
                className="data-[state=checked]:bg-emerald-500"
              />
              <Label htmlFor="is-available" className="text-sm text-gray-200">
                In Stock & Available
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is-featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
                className="data-[state=checked]:bg-[#f98b25]"
              />
              <Label htmlFor="is-featured" className="text-sm text-gray-200">
                Featured
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#f98b25] to-[#e07a00] text-white text-sm font-semibold hover:from-[#e07a00] hover:to-[#c96a00] transition-all disabled:opacity-60 shadow-lg shadow-orange-500/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : item ? (
                "Update Dish"
              ) : (
                "Add Dish"
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
