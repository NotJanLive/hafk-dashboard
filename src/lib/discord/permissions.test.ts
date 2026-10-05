import { describe, expect, it } from "vitest";
import { canManageGuild, missingBotPermissions, REQUIRED_BOT_PERMISSIONS } from "./permissions";

describe("canManageGuild", () => {
  it("allows owners regardless of permissions", () => {
    expect(canManageGuild("0", true)).toBe(true);
  });

  it("allows administrators and server managers", () => {
    expect(canManageGuild(String(1n << 3n), false)).toBe(true);
    expect(canManageGuild(String(1n << 5n), false)).toBe(true);
  });

  it("handles bitfields beyond 2^53", () => {
    expect(canManageGuild(String((1n << 50n) | (1n << 5n)), false)).toBe(true);
  });

  it("denies regular members", () => {
    expect(canManageGuild(String((1n << 10n) | (1n << 11n)), false)).toBe(false);
  });
});

describe("missingBotPermissions", () => {
  it("is empty when all permissions are granted", () => {
    expect(missingBotPermissions(Object.keys(REQUIRED_BOT_PERMISSIONS))).toEqual([]);
  });

  it("lists missing permissions with labels", () => {
    const granted = Object.keys(REQUIRED_BOT_PERMISSIONS).filter((key) => key !== "MANAGE_ROLES");
    expect(missingBotPermissions(granted)).toEqual([{ key: "MANAGE_ROLES", label: "Rollen verwalten" }]);
  });
});
