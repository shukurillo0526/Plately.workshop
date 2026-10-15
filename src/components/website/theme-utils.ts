import type { WebsiteThemeConfig } from "@/lib/types/website";

/**
 * Returns Tailwind class for border radius based on WebsiteThemeConfig.
 */
export function getRadiusClass(
  borderRadius?: "sharp" | "rounded" | "pill",
  element: "card" | "button" | "badge" | "input" | "image" = "card"
): string {
  if (borderRadius === "sharp") {
    return "rounded-none";
  }

  if (borderRadius === "pill") {
    if (element === "button" || element === "badge" || element === "input") {
      return "rounded-full";
    }
    if (element === "image") {
      return "rounded-2xl";
    }
    return "rounded-3xl";
  }

  // "rounded" is the default
  switch (element) {
    case "button":
      return "rounded-xl";
    case "badge":
      return "rounded-lg";
    case "input":
      return "rounded-xl";
    case "image":
      return "rounded-2xl";
    case "card":
    default:
      return "rounded-2xl";
  }
}

/**
 * Returns CSS style object with design tokens for consistent live canvas and storefront rendering.
 */
export function getThemeStyles(config: WebsiteThemeConfig): React.CSSProperties {
  const isSerif = config.fontFamily === "Playfair Display";
  const fontFamilyValue = isSerif
    ? "var(--font-serif, 'Playfair Display', Georgia, serif)"
    : config.fontFamily === "Inter"
    ? "var(--font-sans, 'Inter', system-ui, sans-serif)"
    : "var(--font-display, 'Outfit', system-ui, sans-serif)";

  const borderRadiusValue =
    config.borderRadius === "sharp"
      ? "0px"
      : config.borderRadius === "pill"
      ? "9999px"
      : "12px";

  const cardRadiusValue =
    config.borderRadius === "sharp"
      ? "0px"
      : config.borderRadius === "pill"
      ? "24px"
      : "16px";

  return {
    backgroundColor: config.backgroundColor || "#0d1117",
    color: config.textColor || "#f8fafc",
    fontFamily: fontFamilyValue,
    // CSS Custom Properties for tokens
    "--color-primary": config.primaryColor || "#f98b25",
    "--color-secondary": config.secondaryColor || "#e11d48",
    "--color-bg": config.backgroundColor || "#0d1117",
    "--color-card": config.cardColor || "#161b22",
    "--border-radius": borderRadiusValue,
    "--border-radius-card": cardRadiusValue,
    "--font-family": isSerif ? "serif" : "sans-serif",
  } as React.CSSProperties;
}
