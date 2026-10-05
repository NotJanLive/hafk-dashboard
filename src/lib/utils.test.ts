import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./utils";

describe("safeReturnTo", () => {
  it("keeps same-origin paths", () => {
    expect(safeReturnTo("/servers/123456789012345678/settings")).toBe("/servers/123456789012345678/settings");
  });

  it.each([null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"])(
    "falls back for %s",
    (value) => {
      expect(safeReturnTo(value)).toBe("/servers");
    },
  );
});
