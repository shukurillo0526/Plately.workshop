import type { Metadata } from "next";
import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WebsiteThemeConfig, WebsiteSection } from "@/lib/types/website";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

function formatSlugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fallbackTitle = formatSlugToTitle(slug);

  try {
    const admin = createAdminClient();
    const { data: restaurant } = await admin
      .from("restaurants")
      .select("id, name, slug, description, image_url, address, cuisine_type, phone")
      .eq("slug", slug)
      .maybeSingle();

    let websiteConfig: WebsiteThemeConfig | null = null;
    if (restaurant?.id) {
      const { data: configRow } = await admin
        .from("restaurant_website_configs")
        .select("template, is_published")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();

      if (configRow?.template) {
        websiteConfig = configRow.template as WebsiteThemeConfig;
      }
    }

    const restName = restaurant?.name || fallbackTitle;
    const headline = websiteConfig?.heroHeadline || `Welcome to ${restName}`;
    const tagline =
      websiteConfig?.heroTagline ||
      restaurant?.description ||
      `Experience authentic cuisine, direct online ordering, and interactive table reservations at ${restName}.`;
    const title = `${restName} | ${headline}`;
    const description = tagline;
    const heroImage =
      websiteConfig?.heroImage ||
      restaurant?.image_url ||
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=1200&auto=format&fit=crop&q=80";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: [
          {
            url: heroImage,
            width: 1200,
            height: 630,
            alt: restName,
          },
        ],
        siteName: "Plately Workshop",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [heroImage],
      },
    };
  } catch (err) {
    console.warn("[StoreLayout generateMetadata] Error fetching metadata:", err);
    return {
      title: `${fallbackTitle} | Plately Online Ordering`,
      description: `Direct online ordering and table booking for ${fallbackTitle} on Plately.`,
    };
  }
}

export default async function StoreLayout({ params, children }: Props) {
  const { slug } = await params;
  const fallbackTitle = formatSlugToTitle(slug);

  let schemaData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: fallbackTitle,
    description: `Direct online ordering and table booking for ${fallbackTitle}.`,
    url: `https://plately.uz/store/${slug}`,
  };

  try {
    const admin = createAdminClient();
    const { data: restaurant } = await admin
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    let websiteConfig: WebsiteThemeConfig | null = null;
    if (restaurant?.id) {
      const { data: configRow } = await admin
        .from("restaurant_website_configs")
        .select("template, is_published")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();

      if (configRow?.template) {
        websiteConfig = configRow.template as WebsiteThemeConfig;
      }
    }

    const restName = restaurant?.name || fallbackTitle;
    const hoursSection = websiteConfig?.sections?.find(
      (s: WebsiteSection) => s.type === "hours_location"
    );
    const address =
      hoursSection?.meta?.address || restaurant?.address || "Tashkent, Uzbekistan";
    const phone =
      hoursSection?.meta?.phone || restaurant?.phone || "+998 71 200 00 00";
    const heroImage =
      websiteConfig?.heroImage ||
      restaurant?.image_url ||
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=1200&auto=format&fit=crop&q=80";

    // Extract PostGIS / geographical coordinates
    let lat = 41.2995;
    let lng = 69.2401;
    if (hoursSection?.meta?.coordinates) {
      const coords: any = hoursSection.meta.coordinates;
      lat = coords.lat ?? coords.latitude ?? lat;
      lng = coords.lng ?? coords.longitude ?? lng;
    } else if (hoursSection?.meta?.postgisLocation?.coordinates) {
      // GeoJSON [lng, lat]
      lng = hoursSection.meta.postgisLocation.coordinates[0];
      lat = hoursSection.meta.postgisLocation.coordinates[1];
    }

    schemaData = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: restName,
      description:
        websiteConfig?.heroTagline ||
        restaurant?.description ||
        `Authentic dining and online ordering at ${restName}.`,
      image: heroImage,
      telephone: phone,
      servesCuisine: restaurant?.cuisine_type || "Central Asian Traditional",
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: address,
        addressLocality: "Tashkent",
        addressRegion: "Tashkent",
        addressCountry: "UZ",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: lat,
        longitude: lng,
      },
      url: `https://plately.uz/store/${slug}`,
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "10:00",
          closes: "23:00",
        },
      ],
    };
  } catch (err) {
    console.warn("[StoreLayout Schema] Error generating JSON-LD:", err);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {children}
    </>
  );
}
