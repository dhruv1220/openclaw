// Regression tests: a zero-width table placeholder can share its offset with a
// blockquote/list wrapper that starts there. Source order (not wrapper kind)
// decides ownership — see openclaw/openclaw#168366.
import { describe, expect, it } from "vitest";
import { markdownToTelegramRichBlocks } from "./rich-blocks.js";

const TABLE = "| Brand | Status |\n|---|---|\n| Acme | waiting |";

describe("table segments adjacent to wrappers", () => {
  it("keeps a table before a blockquote as a sibling instead of nesting it", () => {
    const { blocks, degradationReasons } = markdownToTelegramRichBlocks(
      `${TABLE}\n\n> **3 more brands** need a decision.`,
    );
    expect(blocks.map((block) => block.type)).toEqual(["table", "blockquote"]);
    const quote = blocks[1];
    if (quote?.type !== "blockquote") {
      expect(quote?.type).toBe("blockquote");
      return;
    }
    // The table must not leak into the quote's children.
    expect(quote.blocks.map((block) => block.type)).toEqual(["paragraph"]);
    expect(degradationReasons).toEqual([]);
  });

  it("keeps a table before a list as a sibling instead of dropping it", () => {
    const { blocks, degradationReasons } = markdownToTelegramRichBlocks(
      `${TABLE}\n\n- follow up Acme\n- send draft`,
    );
    expect(blocks.map((block) => block.type)).toEqual(["table", "list"]);
    const list = blocks[1];
    if (list?.type !== "list") {
      expect(list?.type).toBe("list");
      return;
    }
    expect(list.items).toHaveLength(2);
    expect(degradationReasons).toEqual([]);
  });

  it("still renders a quote-wrapped table without duplicating it", () => {
    // The source-order rule must not break tables authored inside a quote:
    // a quote containing only a table collapses to the table itself.
    const { blocks } = markdownToTelegramRichBlocks(
      `> ${TABLE.replaceAll("\n", "\n> ")}`,
    );
    expect(blocks.map((block) => block.type)).toEqual(["table"]);
    expect(JSON.stringify(blocks).split("Acme").length - 1).toBe(1);
  });
});
