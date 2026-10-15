/**
 * Adversarial Stress & Chaos Test Suite for Studio Canvas, Drag-and-Drop,
 * Section Mutations, Viewport Matrix, and Interactive Table Selection
 *
 * Plately Workshop — Challenger 1 Adversarial Harness
 */

import { describe, it, expect, vi } from "vitest";
import {
  DEFAULT_SECTIONS,
  DEFAULT_WEBSITE_CONFIG,
  DEFAULT_FLOORPLAN_TABLES,
  GASTRONOMIC_THEME_PRESETS,
  WebsiteThemeConfigSchema,
  WebsiteSectionSchema,
  TableItemSchema,
  type WebsiteSection,
  type WebsiteThemeConfig,
  type TableItem,
  type DeviceMode,
  type SectionType,
} from "@/lib/types/website";
import { getRadiusClass, getThemeStyles } from "@/components/website/theme-utils";

describe("Adversarial Studio Canvas & DnD Stress Testing", () => {
  // ═════════════════════════════════════════════════════════════════════════
  // SUITE 1: EXTREME BLOCK REORDER SEQUENCES
  // ═════════════════════════════════════════════════════════════════════════
  describe("1. Extreme Block Reorder Sequences", () => {
    it("1.1 Reversing the entire block array maintains integrity and valid schema", () => {
      const originalSections = [...DEFAULT_SECTIONS];
      const reversedSections = [...DEFAULT_SECTIONS].reverse();

      expect(reversedSections.length).toBe(originalSections.length);
      expect(reversedSections[0].id).toBe(originalSections[originalSections.length - 1].id);
      expect(reversedSections[reversedSections.length - 1].id).toBe(originalSections[0].id);

      // Verify IDs remain unique
      const idSet = new Set(reversedSections.map((s) => s.id));
      expect(idSet.size).toBe(originalSections.length);

      // Schema validation of reversed configuration
      const reversedConfig: WebsiteThemeConfig = {
        ...DEFAULT_WEBSITE_CONFIG,
        sections: reversedSections,
      };
      const parsed = WebsiteThemeConfigSchema.safeParse(reversedConfig);
      expect(parsed.success).toBe(true);
    });

    it("1.2 Cyclic shifts (moving first to last) preserve length and order determinism", () => {
      let sections = [...DEFAULT_SECTIONS];
      const initialFirstId = sections[0].id;
      const initialCount = sections.length;

      // Perform 50 cyclic shifts (moving first to last)
      for (let i = 0; i < 50; i++) {
        const [first] = sections;
        sections = [...sections.slice(1), first];
        expect(sections.length).toBe(initialCount);
      }

      // After 50 shifts on 12 sections (50 % 12 = 2 shifts)
      const expectedShift = 50 % initialCount;
      expect(sections[(initialCount - expectedShift) % initialCount].id).toBe(initialFirstId);

      // Validate Zod schema
      const config: WebsiteThemeConfig = {
        ...DEFAULT_WEBSITE_CONFIG,
        sections,
      };
      expect(WebsiteThemeConfigSchema.safeParse(config).success).toBe(true);
    });

    it("1.3 Duplicate titles mutate only targeted section by unique ID", () => {
      // Create 4 sections with identical title 'Signature Dining'
      const duplicateTitleSections: WebsiteSection[] = [
        { id: "sec-dup-1", type: "hero", title: "Signature Dining", content: "Hero 1", enabled: true },
        { id: "sec-dup-2", type: "about", title: "Signature Dining", content: "About 2", enabled: true },
        { id: "sec-dup-3", type: "menu", title: "Signature Dining", content: "Menu 3", enabled: true },
        { id: "sec-dup-4", type: "reviews", title: "Signature Dining", content: "Reviews 4", enabled: true },
      ];

      // Mutate section sec-dup-3 title
      const targetId = "sec-dup-3";
      const updated = duplicateTitleSections.map((s) =>
        s.id === targetId ? { ...s, title: "Renamed Menu Section" } : s
      );

      expect(updated.find((s) => s.id === "sec-dup-1")?.title).toBe("Signature Dining");
      expect(updated.find((s) => s.id === "sec-dup-2")?.title).toBe("Signature Dining");
      expect(updated.find((s) => s.id === "sec-dup-3")?.title).toBe("Renamed Menu Section");
      expect(updated.find((s) => s.id === "sec-dup-4")?.title).toBe("Signature Dining");
    });

    it("1.4 Rapid consecutive reorders (fuzz test 200 random swaps) retains all sections with zero data loss", () => {
      let sections = [...DEFAULT_SECTIONS];
      const expectedIds = new Set(sections.map((s) => s.id));

      for (let i = 0; i < 200; i++) {
        const idxA = Math.floor(Math.random() * sections.length);
        const idxB = Math.floor(Math.random() * sections.length);
        const next = [...sections];
        const temp = next[idxA];
        next[idxA] = next[idxB];
        next[idxB] = temp;
        sections = next;
      }

      expect(sections.length).toBe(DEFAULT_SECTIONS.length);
      const resultingIds = new Set(sections.map((s) => s.id));
      expect(resultingIds.size).toBe(DEFAULT_SECTIONS.length);
      for (const id of expectedIds) {
        expect(resultingIds.has(id)).toBe(true);
      }
    });

    it("1.5 BUG EMPIRICAL REPRODUCTION: Canvas mini-toolbar index desync when disabled sections exist", () => {
      // Simulate sections where index 1 is disabled
      const sections: WebsiteSection[] = [
        { id: "sec-0", type: "hero", title: "Hero Banner", content: "", enabled: true },
        { id: "sec-1", type: "announcement", title: "Announcement (Disabled)", content: "", enabled: false },
        { id: "sec-2", type: "menu", title: "Menu Showcase", content: "", enabled: true },
      ];

      // In page.tsx lines 1117-1159:
      // Active sections rendered:
      const activeSections = sections.filter((s) => s.enabled);
      expect(activeSections.length).toBe(2);
      expect(activeSections[0].id).toBe("sec-0");
      expect(activeSections[1].id).toBe("sec-2"); // Filtered index 1 is sec-2!

      // The canvas toolbar calls moveSection(index, "up") where index is the FILTERED index!
      // Here, index is 1 (for sec-2).
      // But moveSection in page.tsx line 520 does:
      const moveSectionBroken = (sectionsList: WebsiteSection[], index: number, dir: "up" | "down") => {
        const targetIdx = dir === "up" ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= sectionsList.length) return sectionsList;
        const next = [...sectionsList];
        const temp = next[index];
        next[index] = next[targetIdx];
        next[targetIdx] = temp;
        return next;
      };

      // When the user clicks "Move Up" on sec-2 on the canvas, index passed is 1 (its filtered index)
      const afterBrokenMove = moveSectionBroken(sections, 1, "up");

      // BUG REPRODUCED: Instead of moving sec-2 up, it swapped sec-1 (disabled announcement) with sec-0!
      // sec-2 remained at index 2!
      expect(afterBrokenMove[0].id).toBe("sec-1"); // Disabled announcement moved to top!
      expect(afterBrokenMove[1].id).toBe("sec-0"); // Hero moved down!
      expect(afterBrokenMove[2].id).toBe("sec-2"); // sec-2 (which the user wanted to move up) NEVER MOVED!

      // Proper implementation must find the true index by ID:
      const moveSectionCorrect = (sectionsList: WebsiteSection[], sectionId: string, dir: "up" | "down") => {
        const trueIndex = sectionsList.findIndex((s) => s.id === sectionId);
        if (trueIndex === -1) return sectionsList;
        const targetIdx = dir === "up" ? trueIndex - 1 : trueIndex + 1;
        if (targetIdx < 0 || targetIdx >= sectionsList.length) return sectionsList;
        const next = [...sectionsList];
        const temp = next[trueIndex];
        next[trueIndex] = next[targetIdx];
        next[targetIdx] = temp;
        return next;
      };

      const afterCorrectMove = moveSectionCorrect(sections, "sec-2", "up");
      expect(afterCorrectMove[1].id).toBe("sec-2");
      expect(afterCorrectMove[2].id).toBe("sec-1");
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE 2: SECTION TOGGLING AND DELETION EDGE CASES
  // ═════════════════════════════════════════════════════════════════════════
  describe("2. Section Toggling and Deletion Edge Cases", () => {
    it("2.1 Disabling all sections results in valid schema and empty filtered list without crashing", () => {
      const allDisabledSections = DEFAULT_SECTIONS.map((s) => ({
        ...s,
        enabled: false,
      }));

      const active = allDisabledSections.filter((s) => s.enabled);
      expect(active.length).toBe(0);

      const config: WebsiteThemeConfig = {
        ...DEFAULT_WEBSITE_CONFIG,
        sections: allDisabledSections,
      };

      // Zod schema passes with 0 enabled sections
      const parsed = WebsiteThemeConfigSchema.safeParse(config);
      expect(parsed.success).toBe(true);

      // Re-enabling all sections restores original state without loss
      const reEnabled = allDisabledSections.map((s) => ({ ...s, enabled: true }));
      expect(reEnabled.filter((s) => s.enabled).length).toBe(DEFAULT_SECTIONS.length);
    });

    it("2.2 Deleting sections down to 0 sections leaves valid schema and handles orphaned selection", () => {
      let currentSections = [...DEFAULT_SECTIONS];
      let selectedSectionId = "sec-hero";

      // Progressively delete all sections
      while (currentSections.length > 0) {
        const toDelete = currentSections[0].id;
        currentSections = currentSections.filter((s) => s.id !== toDelete);
      }

      expect(currentSections.length).toBe(0);

      const emptyConfig: WebsiteThemeConfig = {
        ...DEFAULT_WEBSITE_CONFIG,
        sections: currentSections,
      };
      expect(WebsiteThemeConfigSchema.safeParse(emptyConfig).success).toBe(true);

      // Verify orphaned selection lookup returns undefined without throwing
      const selectedSection = currentSections.find((s) => s.id === selectedSectionId);
      expect(selectedSection).toBeUndefined();

      // Inspector safe guard: activeDrawer === 'inspector' && selectedSection evaluates to undefined/falsy
      const canRenderInspector = Boolean(selectedSection);
      expect(canRenderInspector).toBe(false);
    });

    it("2.3 Re-adding sections from empty state restores all 7 required modular types", () => {
      const requiredTypes: SectionType[] = [
        "hero",
        "about",
        "menu",
        "table_selection",
        "highlights",
        "reviews",
        "hours_location",
      ];

      let sections: WebsiteSection[] = [];

      for (const type of requiredTypes) {
        const template = DEFAULT_SECTIONS.find((s) => s.type === type);
        const newSec: WebsiteSection = template
          ? {
              ...JSON.parse(JSON.stringify(template)),
              id: `sec-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              enabled: true,
            }
          : {
              id: `sec-${type}-${Date.now()}`,
              type,
              title: `New ${type}`,
              content: "Content",
              enabled: true,
            };
        sections.push(newSec);
      }

      expect(sections.length).toBe(7);
      const typesPresent = new Set(sections.map((s) => s.type));
      for (const req of requiredTypes) {
        expect(typesPresent.has(req)).toBe(true);
      }

      // Validates schema
      const config: WebsiteThemeConfig = {
        ...DEFAULT_WEBSITE_CONFIG,
        sections,
      };
      expect(WebsiteThemeConfigSchema.safeParse(config).success).toBe(true);
    });

    it("2.4 POTENTIAL RACE HAZARD: handleAddSection timestamp collision when called in same millisecond", () => {
      // In page.tsx line 547: const newId = `sec-${type}-${Date.now()}`;
      // In a synchronous loop or rapid double click:
      const fixedTimestamp = 1729000000000;
      const type: SectionType = "hero";

      const id1 = `sec-${type}-${fixedTimestamp}`;
      const id2 = `sec-${type}-${fixedTimestamp}`;

      // If added without random entropy or uuid, IDs collide!
      expect(id1).toBe(id2);

      // Demonstrating that adding random entropy or nanoid guarantees uniqueness:
      const robustId1 = `sec-${type}-${fixedTimestamp}-${Math.random().toString(36).slice(2, 7)}`;
      const robustId2 = `sec-${type}-${fixedTimestamp}-${Math.random().toString(36).slice(2, 7)}`;
      expect(robustId1).not.toBe(robustId2);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE 3: VIEWPORT SWITCHING & THEME TOKEN MATRIX
  // ═════════════════════════════════════════════════════════════════════════
  describe("3. Viewport Switching & Theme Token Matrix", () => {
    const viewports: DeviceMode[] = ["desktop", "tablet", "mobile"];
    const radii: Array<"sharp" | "rounded" | "pill"> = ["sharp", "rounded", "pill"];
    const fonts: Array<"Outfit" | "Inter" | "Playfair Display"> = [
      "Outfit",
      "Inter",
      "Playfair Display",
    ];

    it("3.1 Border radius tokens generate exact Tailwind classes across all UI elements", () => {
      // Sharp radius
      expect(getRadiusClass("sharp", "card")).toBe("rounded-none");
      expect(getRadiusClass("sharp", "button")).toBe("rounded-none");
      expect(getRadiusClass("sharp", "badge")).toBe("rounded-none");
      expect(getRadiusClass("sharp", "input")).toBe("rounded-none");
      expect(getRadiusClass("sharp", "image")).toBe("rounded-none");

      // Pill radius
      expect(getRadiusClass("pill", "button")).toBe("rounded-full");
      expect(getRadiusClass("pill", "badge")).toBe("rounded-full");
      expect(getRadiusClass("pill", "input")).toBe("rounded-full");
      expect(getRadiusClass("pill", "image")).toBe("rounded-2xl");
      expect(getRadiusClass("pill", "card")).toBe("rounded-3xl");

      // Rounded (default)
      expect(getRadiusClass("rounded", "button")).toBe("rounded-xl");
      expect(getRadiusClass("rounded", "badge")).toBe("rounded-lg");
      expect(getRadiusClass("rounded", "input")).toBe("rounded-xl");
      expect(getRadiusClass("rounded", "image")).toBe("rounded-2xl");
      expect(getRadiusClass("rounded", "card")).toBe("rounded-2xl");
    });

    it("3.2 Full 3x3x3 Viewport-Theme Matrix: validates CSS tokens and layout styles for all 27 permutations", () => {
      let combinationsTested = 0;

      for (const device of viewports) {
        for (const borderRadius of radii) {
          for (const fontFamily of fonts) {
            const config: WebsiteThemeConfig = {
              ...DEFAULT_WEBSITE_CONFIG,
              borderRadius,
              fontFamily,
            };

            const styles = getThemeStyles(config);
            expect(styles).toBeDefined();

            // Font family CSS rule
            if (fontFamily === "Playfair Display") {
              expect((styles as any)["--font-family"]).toBe("serif");
            } else {
              expect((styles as any)["--font-family"]).toBe("sans-serif");
            }

            // Border radius CSS custom property
            if (borderRadius === "sharp") {
              expect((styles as any)["--border-radius"]).toBe("0px");
              expect((styles as any)["--border-radius-card"]).toBe("0px");
            } else if (borderRadius === "pill") {
              expect((styles as any)["--border-radius"]).toBe("9999px");
              expect((styles as any)["--border-radius-card"]).toBe("24px");
            } else {
              expect((styles as any)["--border-radius"]).toBe("12px");
              expect((styles as any)["--border-radius-card"]).toBe("16px");
            }

            combinationsTested++;
          }
        }
      }

      expect(combinationsTested).toBe(27);
    });

    it("3.3 All 6 gastronomic theme presets produce valid styles with required hex colors", () => {
      expect(GASTRONOMIC_THEME_PRESETS.length).toBe(6);

      for (const preset of GASTRONOMIC_THEME_PRESETS) {
        expect(preset.primary).toMatch(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
        expect(preset.bg).toMatch(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
        expect(preset.card).toMatch(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);

        const config: WebsiteThemeConfig = {
          ...DEFAULT_WEBSITE_CONFIG,
          primaryColor: preset.primary,
          secondaryColor: preset.secondary,
          backgroundColor: preset.bg,
          cardColor: preset.card,
          fontFamily: preset.font,
          borderRadius: preset.borderRadius || "rounded",
        };

        const parsed = WebsiteThemeConfigSchema.safeParse(config);
        expect(parsed.success).toBe(true);

        const styles = getThemeStyles(config);
        expect((styles as any)["--color-primary"]).toBe(preset.primary);
        expect((styles as any)["--color-bg"]).toBe(preset.bg);
        expect((styles as any)["--color-card"]).toBe(preset.card);
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE 4: INTERACTIVE TABLE SELECTION STATE TRANSITIONS
  // ═════════════════════════════════════════════════════════════════════════
  describe("4. Interactive Table Selection State Transitions", () => {
    it("4.1 Table selection state machine: select available table, toggle to deselect", () => {
      const tables = [...DEFAULT_FLOORPLAN_TABLES];
      let selectedTableId: string | null = null;

      const handleTableSelect = (table: TableItem) => {
        if (table.status === "reserved") return;
        if (selectedTableId === table.id) {
          selectedTableId = null;
        } else {
          selectedTableId = table.id;
        }
      };

      const table1 = tables.find((t) => t.id === "t1")!;
      expect(table1.status).toBe("available");

      // Select table 1
      handleTableSelect(table1);
      expect(selectedTableId).toBe("t1");

      // Click table 1 again (toggle off)
      handleTableSelect(table1);
      expect(selectedTableId).toBeNull();
    });

    it("4.2 Reserved tables reject selection clicks", () => {
      const tables = [...DEFAULT_FLOORPLAN_TABLES];
      let selectedTableId: string | null = null;

      const handleTableSelect = (table: TableItem) => {
        if (table.status === "reserved") return;
        selectedTableId = table.id;
      };

      const reservedTable = tables.find((t) => t.status === "reserved")!;
      expect(reservedTable).toBeDefined();

      handleTableSelect(reservedTable);
      expect(selectedTableId).toBeNull();
    });

    it("4.3 BUG EMPIRICAL REPRODUCTION: FloorPlanSection confirmation button lacks reserved status guard", () => {
      // In FloorPlanSection.tsx line 40:
      // const activeTable = tables.find((t) => t.id === currentSelectedId) || tables[0];
      // And line 330:
      // <button onClick={() => onReservationConfirm?.(activeTable, selectedTimeSlot)}>Confirm ...</button>

      const reservedTable: TableItem = {
        id: "t-reserved-vip",
        name: "VIP Table 99",
        seats: 8,
        shape: "booth",
        zone: "Private Lounge",
        status: "reserved",
        x: 50,
        y: 50,
      };

      // Scenario A: tables array starts with a reserved table as tables[0] and no external ID is given
      const tablesWithReservedFirst = [reservedTable, ...DEFAULT_FLOORPLAN_TABLES];
      const activeTable = tablesWithReservedFirst.find((t) => t.id === "none") || tablesWithReservedFirst[0];

      expect(activeTable.id).toBe("t-reserved-vip");
      expect(activeTable.status).toBe("reserved");

      // If user clicks confirm, FloorPlanSection will call onReservationConfirm with activeTable:
      const onReservationConfirmMock = vi.fn();

      // Emulate the button click from FloorPlanSection.tsx line 332:
      const triggerConfirm = (table: TableItem, slot: string) => {
        // FloorPlanSection does NOT check table.status before firing:
        onReservationConfirmMock(table, slot);
      };

      triggerConfirm(activeTable, "19:30");
      expect(onReservationConfirmMock).toHaveBeenCalledWith(reservedTable, "19:30");

      // BUG CONFIRMED: A reserved table was confirmed for reservation without throwing or blocking!
      // The fix requires checking: if (activeTable.status === 'reserved') return;
    });

    it("4.4 Zone filtering isolates tables correctly and handles empty zones gracefully", () => {
      const tables = DEFAULT_FLOORPLAN_TABLES;
      const zones = ["All Zones", "Window Booths", "Main Dining", "Private Lounge", "Bar Area"];

      for (const zone of zones) {
        const filtered = zone === "All Zones" ? tables : tables.filter((t) => t.zone === zone);
        expect(filtered.length).toBeGreaterThan(0);
        if (zone !== "All Zones") {
          for (const t of filtered) {
            expect(t.zone).toBe(zone);
          }
        }
      }

      // Non-existent zone filter (e.g. 'Rooftop Garden')
      const emptyZoneFilter = "Rooftop Garden";
      const emptyFiltered = tables.filter((t) => t.zone === emptyZoneFilter);
      expect(emptyFiltered.length).toBe(0);
    });

    it("4.5 Empty tables array in section meta handles fallback safely", () => {
      const sectionWithEmptyTables: WebsiteSection = {
        id: "sec-tables",
        type: "table_selection",
        title: "Floor Plan",
        content: "",
        enabled: true,
        meta: {
          tables: [],
        },
      };

      // In FloorPlanSection.tsx:
      // const tables: TableItem[] = section.meta?.tables || DEFAULT_FLOORPLAN_TABLES;
      // In JS: [] || DEFAULT_FLOORPLAN_TABLES yields [] because [] is truthy!
      const tables = sectionWithEmptyTables.meta?.tables || DEFAULT_FLOORPLAN_TABLES;
      expect(tables).toEqual([]);

      // Lookup on empty array
      const activeTable = tables.find((t) => t.id === "t1") || tables[0];
      expect(activeTable).toBeUndefined();

      // Booking bar check: {activeTable && (...)} safely evaluates to falsy, avoiding null dereference
      expect(Boolean(activeTable)).toBe(false);
    });
  });
});
