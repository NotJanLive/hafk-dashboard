import { describe, expect, it } from "vitest";
import { hsvToInt, intToHsv } from "./color";

describe("hsv conversion", () => {
  it("converts primary colors", () => {
    expect(hsvToInt({ h: 0, s: 1, v: 1 })).toBe(0xff0000);
    expect(hsvToInt({ h: 120, s: 1, v: 1 })).toBe(0x00ff00);
    expect(hsvToInt({ h: 240, s: 1, v: 1 })).toBe(0x0000ff);
    expect(hsvToInt({ h: 360, s: 1, v: 1 })).toBe(0xff0000);
  });

  it("handles white and black", () => {
    expect(intToHsv(0xffffff)).toEqual({ h: 0, s: 0, v: 1 });
    expect(intToHsv(0x000000)).toEqual({ h: 0, s: 0, v: 0 });
  });

  it.each([0x5b6cff, 0xed4245, 0x2fbf71, 0xf5a524, 0x123456])("round-trips %s", (color) => {
    expect(hsvToInt(intToHsv(color))).toBe(color);
  });
});
