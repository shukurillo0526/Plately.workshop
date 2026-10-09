import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/website/config?restaurantId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json({ error: "restaurantId is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("restaurant_website_configs")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (error) {
      console.warn("[WebsiteConfig GET] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config: data?.template || null,
      record: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/website/config (Save draft)
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
    const { data, error } = await admin
      .from("restaurant_website_configs")
      .upsert(
        {
          restaurant_id: restaurantId,
          template: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "restaurant_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[WebsiteConfig POST] upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Website draft saved successfully",
      record: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
