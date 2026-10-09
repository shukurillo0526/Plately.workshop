import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurantId, config } = body;

    if (!restaurantId || !config) {
      return NextResponse.json(
        { error: "restaurantId and config are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // 1. Upsert into restaurant_website_configs with is_published: true
    const { data: websiteData, error: websiteError } = await admin
      .from("restaurant_website_configs")
      .upsert(
        {
          restaurant_id: restaurantId,
          template: config,
          is_published: true,
          published_at: now,
          updated_at: now,
        },
        { onConflict: "restaurant_id" }
      )
      .select()
      .single();

    if (websiteError) {
      console.error("[WebsitePublish] Error upserting website config:", websiteError);
      return NextResponse.json({ error: websiteError.message }, { status: 500 });
    }

    // 2. Also update restaurant table branding if primaryColor is specified
    if (config.primaryColor) {
      await admin
        .from("restaurants")
        .update({
          updated_at: now,
        })
        .eq("id", restaurantId);
    }

    return NextResponse.json({
      success: true,
      message: "Website published successfully! Changes are live on your storefront.",
      item: websiteData,
    });
  } catch (err: any) {
    console.error("[WebsitePublish] Internal error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to publish website" },
      { status: 500 }
    );
  }
}
