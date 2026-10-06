import { describe, expect, it } from "vitest";
import { cleanPayload, colorToHex, exportPayload, hexToColor, parseImport, totalLength } from "./payload";

describe("colors", () => {
  it("converts between hex and integers", () => {
    expect(colorToHex(0x5b6cff)).toBe("#5b6cff");
    expect(hexToColor("#5B6CFF")).toBe(0x5b6cff);
    expect(hexToColor("5b6cff")).toBe(0x5b6cff);
    expect(hexToColor("#xyz")).toBeUndefined();
  });
});

describe("cleanPayload", () => {
  it("removes empty values", () => {
    expect(
      cleanPayload({
        content: "  ",
        embeds: [{ title: "Regeln", description: "", footer: { text: "" }, image: { url: "" }, fields: [] }],
      }),
    ).toEqual({ embeds: [{ title: "Regeln" }] });
  });
});

describe("parseImport", () => {
  it("reads a Discord message object and ignores unknown properties", () => {
    const result = parseImport(
      JSON.stringify({
        content: "Hi",
        embeds: [{ title: "T", type: "rich", footer: { text: "F", icon_url: "https://x.org/i.png" } }],
        attachments: [],
      }),
    );
    expect(result).toEqual({
      ok: true,
      payload: { content: "Hi", embeds: [{ title: "T", footer: { text: "F", icon_url: "https://x.org/i.png" } }] },
    });
  });

  it("wraps a single embed", () => {
    expect(parseImport('{"title":"Nur ein Embed","color":255}')).toEqual({
      ok: true,
      payload: { embeds: [{ title: "Nur ein Embed", color: 255 }] },
    });
  });

  it("reads Discohook backups", () => {
    const result = parseImport(JSON.stringify({ messages: [{ data: { content: "Aus Discohook", embeds: null } }] }));
    expect(result.ok).toBe(true);
  });

  it("rejects invalid JSON and empty messages", () => {
    expect(parseImport("{nope").ok).toBe(false);
    expect(parseImport('{"content":""}').ok).toBe(false);
  });

  it("round-trips through export", () => {
    const payload = { content: "A", embeds: [{ title: "B", fields: [{ name: "C", value: "D", inline: true }] }] };
    expect(parseImport(exportPayload(payload))).toEqual({ ok: true, payload });
  });
});

describe("totalLength", () => {
  it("counts embed text like Discord", () => {
    expect(totalLength({ embeds: [{ title: "ab", description: "cde", fields: [{ name: "f", value: "gh" }] }] })).toBe(
      8,
    );
  });
});
