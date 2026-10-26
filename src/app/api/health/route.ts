import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbLatency = 0;
  let dbError: string | null = null;

  try {
    const supabase = createAdminClient();
    const dbQueryStart = Date.now();
    // Query a lightweight table with limit 1 to confirm DB connectivity
    const { error } = await supabase
      .from("restaurant_website_configs")
      .select("id")
      .limit(1);

    dbLatency = Date.now() - dbQueryStart;

    if (error) {
      dbError = error.message;
      dbStatus = "disconnected";
    } else {
      dbStatus = "connected";
    }
  } catch (err: any) {
    dbError = err?.message || "Unknown database error";
    dbStatus = "disconnected";
  }

  const isHealthy = dbStatus === "connected";
  const overallStatus = isHealthy ? "ok" : "degraded";
  const mem = process.memoryUsage();

  const body = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime() * 100) / 100,
    environment: process.env.NODE_ENV || "development",
    version: "0.1.0",
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
      error: dbError,
    },
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      rssBytes: mem.rss,
      heapUsedBytes: mem.heapUsed,
    },
  };

  return NextResponse.json(body, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

export async function HEAD() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("restaurant_website_configs")
      .select("id")
      .limit(1);

    if (error) {
      return new Response(null, {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }
    return new Response(null, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch {
    return new Response(null, {
      status: 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  }
}
