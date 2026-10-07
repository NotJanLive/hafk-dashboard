import { describe, expect, it } from "vitest";
import { formatDiscordTimestamp } from "./timestamp";

describe("formatDiscordTimestamp", () => {
  const now = Date.UTC(2026, 9, 6, 12, 0, 0);
  const seconds = now / 1000;

  it("formats relative timestamps in German", () => {
    expect(formatDiscordTimestamp(seconds + 3 * 3600, "R", now)).toBe("in 3 Stunden");
    expect(formatDiscordTimestamp(seconds - 2 * 60, "R", now)).toBe("vor 2 Minuten");
  });

  it("formats long dates with the month name", () => {
    expect(formatDiscordTimestamp(seconds, "D", now)).toBe("6. Oktober 2026");
  });
});
