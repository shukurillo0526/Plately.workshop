import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workshop.plately.uz";

    const { data: restaurants, error: restError } = await admin
      .from("restaurants")
      .select("id, name, slug, cuisine_type, price_range, rating, review_count, address, image_url, is_open, avg_prep_minutes, delivery_fee, tags, branches(*)")
      .eq("is_open", true)
      .order("rating", { ascending: false });

    if (restError) {
      return NextResponse.json({ error: restError.message }, { status: 500 });
    }

    const items = (restaurants || []).map((r) => ({
      ...r,
      storefront_url: r.slug ? `${appUrl}/store/${r.slug}` : null,
      branches: (r.branches || []).filter((b: any) => b.is_active),
    }));

    return NextResponse.json(
      { success: true, count: items.length, restaurants: items },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
