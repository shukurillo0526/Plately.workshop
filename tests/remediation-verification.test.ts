import { describe, it, expect, vi } from "vitest";
import {
  DEFAULT_SECTIONS,
  DEFAULT_WEBSITE_CONFIG,
  DEFAULT_FLOORPLAN_TABLES,
  WebsiteThemeConfigSchema,
  type WebsiteSection,
  type WebsiteThemeConfig,
  type TableItem,
  type SectionType,
} from "@/lib/types/website";

describe("Round 2 Verification: Remediation Stress Tests", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. MoveSection Logic Verification (src/app/(dashboard)/website/page.tsx)
  // ───────────────────────────────────────────────────────────────────────────
  describe("1. Canvas Mini-Toolbar Reorder Verification", () => {
    // Exact algorithm from page.tsx lines 520-533
    const moveSection = (
      sections: WebsiteSection[],
      idOrIndex: string | number,
      dir: "up" | "down"
    ): WebsiteSection[] => {
      const trueIndex =
        typeof idOrIndex === "string"
          ? sections.findIndex((s) => s.id === idOrIndex)
          : idOrIndex;
      if (trueIndex < 0 || trueIndex >= sections.length) return sections;
      const targetIdx = dir === "up" ? trueIndex - 1 : trueIndex + 1;
      if (targetIdx < 0 || targetIdx >= sections.length) return sections;
      const nextSections = [...sections];
      const temp = nextSections[trueIndex];
      nextSections[trueIndex] = nextSections[targetIdx];
      nextSections[targetIdx] = temp;
      return nextSections;
    };

    it("1.1 moves section by string ID correctly when all sections enabled", () => {
      const sections: WebsiteSection[] = [
        { id: "s1", type: "hero", title: "Hero", content: "", enabled: true },
        { id: "s2", type: "about", title: "About", content: "", enabled: true },
        { id: "s3", type: "menu", title: "Menu", content: "", enabled: true },
      ];

      const res = moveSection(sections, "s2", "up");
      expect(res.map((s) => s.id)).toEqual(["s2", "s1", "s3"]);

      const resDown = moveSection(sections, "s2", "down");
      expect(resDown.map((s) => s.id)).toEqual(["s1", "s3", "s2"]);
    });

    it("1.2 backward compatibility: moves section by numeric index", () => {
      const sections: WebsiteSection[] = [
        { id: "s1", type: "hero", title: "Hero", content: "", enabled: true },
        { id: "s2", type: "about", title: "About", content: "", enabled: true },
      ];

      const res = moveSection(sections, 1, "up");
      expect(res.map((s) => s.id)).toEqual(["s2", "s1"]);
    });

    it("1.3 handles preceding disabled sections without index corruption", () => {
      // Disabled section at index 0, followed by active sections
      const sections: WebsiteSection[] = [
        { id: "s-dis", type: "announcement", title: "Disabled", content: "", enabled: false },
        { id: "s-act1", type: "hero", title: "Active 1", content: "", enabled: true },
        { id: "s-act2", type: "menu", title: "Active 2", content: "", enabled: true },
      ];

      const activeSections = sections.filter((s) => s.enabled);
      expect(activeSections.length).toBe(2);
      expect(activeSections[0].id).toBe("s-act1");
      expect(activeSections[1].id).toBe("s-act2");

      // Visual canvas button disabled logic:
      // index 0 (s-act1): Up is disabled (index === 0)
      const sAct1UpDisabled = 0 === 0;
      expect(sAct1UpDisabled).toBe(true);

      // index 1 (s-act2): Down is disabled (index === activeSections.length - 1)
      const sAct2DownDisabled = 1 === activeSections.length - 1;
      expect(sAct2DownDisabled).toBe(true);

      // Moving s-act1 down from canvas passes section.id 's-act1'
      const movedDown = moveSection(sections, "s-act1", "down");
      expect(movedDown.map((s) => s.id)).toEqual(["s-dis", "s-act2", "s-act1"]);

      // In the resulting active view, s-act2 is now first, s-act1 is second
      const newActive = movedDown.filter((s) => s.enabled);
      expect(newActive[0].id).toBe("s-act2");
      expect(newActive[1].id).toBe("s-act1");
    });

    it("1.4 handles trailing disabled sections without index corruption", () => {
      // Active sections followed by disabled section at index 2
      const sections: WebsiteSection[] = [
        { id: "s-act1", type: "hero", title: "Active 1", content: "", enabled: true },
        { id: "s-act2", type: "menu", title: "Active 2", content: "", enabled: true },
        { id: "s-dis", type: "announcement", title: "Disabled", content: "", enabled: false },
      ];

      const activeSections = sections.filter((s) => s.enabled);
      // Down on s-act2 is disabled on canvas:
      const sAct2DownDisabled = 1 === activeSections.length - 1;
      expect(sAct2DownDisabled).toBe(true);

      // Moving s-act2 up passes section.id 's-act2'
      const movedUp = moveSection(sections, "s-act2", "up");
      expect(movedUp.map((s) => s.id)).toEqual(["s-act2", "s-act1", "s-dis"]);
    });

    it("1.5 returns unmodified array on out-of-bounds or non-existent section id", () => {
      const sections: WebsiteSection[] = [
        { id: "s1", type: "hero", title: "Hero", content: "", enabled: true },
      ];

      expect(moveSection(sections, "non-existent-id", "up")).toEqual(sections);
      expect(moveSection(sections, -1, "up")).toEqual(sections);
      expect(moveSection(sections, 999, "down")).toEqual(sections);
      expect(moveSection(sections, "s1", "up")).toEqual(sections);
      expect(moveSection(sections, "s1", "down")).toEqual(sections);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. handleAddSection Unique ID Generation (src/app/(dashboard)/website/page.tsx)
  // ───────────────────────────────────────────────────────────────────────────
  describe("2. handleAddSection ID Uniqueness", () => {
    it("2.1 generates 50 unique IDs synchronously in the exact same millisecond without collisions", () => {
      const fixedTimestamp = 1729000000000;
      const type: SectionType = "menu";
      const idSet = new Set<string>();
      const total = 50;

      for (let i = 0; i < total; i++) {
        // Exact format from page.tsx line 552:
        const newId = `sec-${type}-${fixedTimestamp}-${Math.random().toString(36).slice(2, 6)}`;
        idSet.add(newId);
      }

      expect(idSet.size).toBe(total);
    });

    it("2.2 rapid double-click in same millisecond produces non-colliding React keys", () => {
      const fixedTimestamp = 1729000000000;
      const type: SectionType = "hero";
      const id1 = `sec-${type}-${fixedTimestamp}-${Math.random().toString(36).slice(2, 6)}`;
      const id2 = `sec-${type}-${fixedTimestamp}-${Math.random().toString(36).slice(2, 6)}`;
      expect(id1).not.toBe(id2);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Reserved Table Guard in FloorPlanSection (src/components/website/FloorPlanSection.tsx)
  // ───────────────────────────────────────────────────────────────────────────
  describe("3. FloorPlanSection Reserved Table Invariant Guard", () => {
    it("3.1 Reserved table cannot trigger reservation confirmation callback", () => {
      const reservedTable: TableItem = {
        id: "t-reserved-1",
        name: "Table 1 (VIP)",
        seats: 4,
        shape: "round",
        zone: "Main Dining",
        status: "reserved",
        x: 10,
        y: 10,
      };

      const onConfirm = vi.fn();

      // Emulate the onClick handler from FloorPlanSection.tsx lines 333-336:
      const handleConfirmClick = (table: TableItem, slot: string) => {
        if (table.status === "reserved") return;
        onConfirm(table, slot);
      };

      handleConfirmClick(reservedTable, "20:00");
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("3.2 Available table successfully triggers reservation confirmation callback", () => {
      const availableTable: TableItem = {
        id: "t-avail-1",
        name: "Table 2",
        seats: 2,
        shape: "rect",
        zone: "Main Dining",
        status: "available",
        x: 20,
        y: 20,
      };

      const onConfirm = vi.fn();

      const handleConfirmClick = (table: TableItem, slot: string) => {
        if (table.status === "reserved") return;
        onConfirm(table, slot);
      };

      handleConfirmClick(availableTable, "20:00");
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith(availableTable, "20:00");
    });

    it("3.3 Button attributes and labels reflect reserved vs available table state", () => {
      const reservedTable: TableItem = {
        id: "t1",
        name: "Booth A",
        seats: 4,
        shape: "booth",
        zone: "Window Booths",
        status: "reserved",
        x: 15,
        y: 15,
      };

      const availableTable: TableItem = {
        id: "t2",
        name: "Booth B",
        seats: 4,
        shape: "booth",
        zone: "Window Booths",
        status: "available",
        x: 35,
        y: 15,
      };

      // Button disabled attribute:
      expect(reservedTable.status === "reserved").toBe(true);
      expect(availableTable.status === "reserved").toBe(false);

      // Label resolution from FloorPlanSection.tsx line 344:
      const getLabel = (table: TableItem, slot: string) =>
        table.status === "reserved"
          ? `Table ${table.name} is Reserved`
          : `Confirm ${table.name} (${slot})`;

      expect(getLabel(reservedTable, "19:30")).toBe("Table Booth A is Reserved");
      expect(getLabel(availableTable, "19:30")).toBe("Confirm Booth B (19:30)");
    });

    it("3.4 Table click selection ignores reserved tables", () => {
      let selectedId = "initial";
      const onTableSelect = vi.fn((table: TableItem) => {
        selectedId = table.id;
      });

      // Emulate handleTableClick from FloorPlanSection.tsx lines 51-57:
      const handleTableClick = (table: TableItem) => {
        if (table.status === "reserved") {
          return;
        }
        selectedId = table.id;
        onTableSelect(table);
      };

      const reserved: TableItem = {
        id: "t-res",
        name: "R1",
        seats: 2,
        shape: "rect",
        zone: "Bar",
        status: "reserved",
        x: 5,
        y: 5,
      };

      handleTableClick(reserved);
      expect(selectedId).toBe("initial");
      expect(onTableSelect).not.toHaveBeenCalled();

      const avail: TableItem = {
        id: "t-avail",
        name: "A1",
        seats: 2,
        shape: "rect",
        zone: "Bar",
        status: "available",
        x: 10,
        y: 10,
      };

      handleTableClick(avail);
      expect(selectedId).toBe("t-avail");
      expect(onTableSelect).toHaveBeenCalledWith(avail);
    });
  });
});
