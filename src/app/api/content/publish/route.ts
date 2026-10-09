import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type, // 'reel' | 'story' | 'post'
      restaurantId,
      caption,
      mediaUrl,
      title,
      tags = [],
      recipeId = null,
      authorName,
      authorId: explicitAuthorId,
    } = body;

    if (!restaurantId || !type || !caption) {
      return NextResponse.json(
        { error: "restaurantId, type, and caption are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Resolve author_id from staff or users if not provided
    let authorId = explicitAuthorId;
    let resolvedAuthorName = authorName;

    if (!authorId) {
      // Find staff owner for this restaurant
      const { data: staffMember } = await admin
        .from("staff")
        .select("user_id, display_name")
        .eq("restaurant_id", restaurantId)
        .limit(1)
        .maybeSingle();

      if (staffMember?.user_id) {
        authorId = staffMember.user_id;
        if (!resolvedAuthorName) resolvedAuthorName = staffMember.display_name;
      }
    }

    // Fallback: If still no authorId, get restaurant name
    const { data: restaurant } = await admin
      .from("restaurants")
      .select("id, name")
      .eq("id", restaurantId)
      .maybeSingle();

    if (!resolvedAuthorName) {
      resolvedAuthorName = restaurant?.name || "Restaurant Partner";
    }

    // If still no valid authorId, use the system demo user
    if (!authorId) {
      authorId = "00000000-0000-4000-8000-000000000001";
    }

    // Helper to extract YouTube video ID if URL is provided
    const extractYouTubeId = (url: string) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    };

    let resultRecord: any = null;

    if (type === "reel") {
      const ytId = extractYouTubeId(mediaUrl) || "ZX3gH0BSTR4";
      const embedUrl = `https://www.youtube.com/embed/${ytId}`;
      const thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

      // 1. Insert or update video_feeds
      const { data: videoData, error: videoError } = await admin
        .from("video_feeds")
        .upsert(
          {
            tab_type: "cook",
            title: title || caption.slice(0, 50),
            description: caption,
            youtube_id: ytId,
            embed_url: embedUrl,
            thumbnail_url: thumbUrl,
            author_name: resolvedAuthorName,
            tags: Array.isArray(tags) ? tags : [tags],
            restaurant_id: restaurantId,
            is_active: true,
            likes: Math.floor(Math.random() * 200) + 50,
          },
          { onConflict: "youtube_id" }
        )
        .select()
        .single();

      if (videoError) throw videoError;

      // 2. Also insert into posts table as a reel for unified social feed
      await admin.from("posts").insert({
        author_id: authorId,
        caption: caption,
        post_type: "reel",
        video_url: mediaUrl.includes("youtube") ? mediaUrl : `https://youtube.com/watch?v=${ytId}`,
        thumbnail_url: thumbUrl,
        tags: Array.isArray(tags) ? tags : [tags],
        restaurant_id: restaurantId,
        visibility: "public",
        like_count: Math.floor(Math.random() * 50) + 10,
        view_count: Math.floor(Math.random() * 300) + 100,
      });

      resultRecord = videoData;
    } else if (type === "story") {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data: storyData, error: storyError } = await admin
        .from("stories")
        .insert({
          author_id: authorId,
          media_url: mediaUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
          media_type: "image",
          caption: caption,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (storyError) throw storyError;
      resultRecord = storyData;
    } else if (type === "post") {
      const { data: postData, error: postError } = await admin
        .from("posts")
        .insert({
          author_id: authorId,
          caption: caption,
          post_type: "photo",
          media_urls: mediaUrl ? [mediaUrl] : [],
          tags: Array.isArray(tags) ? tags : [tags],
          restaurant_id: restaurantId,
          recipe_id: recipeId,
          visibility: "public",
          location_name: restaurant?.name || "Tashkent",
          like_count: 0,
          view_count: 0,
          comment_count: 0,
        })
        .select()
        .single();

      if (postError) throw postError;
      resultRecord = postData;
    }

    return NextResponse.json({
      success: true,
      type,
      message: `Published ${type} successfully to Plately App Explore!`,
      item: resultRecord,
    });
  } catch (err: any) {
    console.error("[ContentPublish] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to publish content" },
      { status: 500 }
    );
  }
}
