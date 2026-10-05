import { describe, expect, it } from "vitest";
import { parseMentions } from "./mentions";

describe("parseMentions", () => {
  it("returns plain text unchanged", () => {
    expect(parseMentions("Setup abgeschlossen")).toEqual([{ type: "text", value: "Setup abgeschlossen" }]);
  });

  it("splits channel, role and user mentions", () => {
    expect(parseMentions("Log-Kanal auf <#123456789012345678> gesetzt von <@!223456789012345678>")).toEqual([
      { type: "text", value: "Log-Kanal auf " },
      { type: "channel", id: "123456789012345678" },
      { type: "text", value: " gesetzt von " },
      { type: "user", id: "223456789012345678" },
    ]);
  });

  it("handles adjacent role mentions", () => {
    expect(parseMentions("<@&123456789012345678>, <@&223456789012345678>")).toEqual([
      { type: "role", id: "123456789012345678" },
      { type: "text", value: ", " },
      { type: "role", id: "223456789012345678" },
    ]);
  });

  it("ignores things that only look like mentions", () => {
    expect(parseMentions("<#abc> und <@123>")).toEqual([{ type: "text", value: "<#abc> und <@123>" }]);
  });
});
