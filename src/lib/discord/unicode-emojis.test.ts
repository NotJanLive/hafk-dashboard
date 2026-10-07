import { describe, expect, it } from "vitest";
import { discordForm } from "./unicode-emojis";

describe("discordForm", () => {
  it("drops the variation selector for emojis that are emoji by default", () => {
    expect(discordForm({ emoji: "🚘️", type: 1 })).toBe("🚘");
  });

  it("keeps the variation selector where Discord needs it", () => {
    expect(discordForm({ emoji: "⛏️", type: 0 })).toBe("⛏️");
    expect(discordForm({ emoji: "❤️‍🔥", type: 1 })).toBe("❤️‍🔥");
  });
});
