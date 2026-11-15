import { describe, expect, it } from "vitest";
import { canDeleteRepair, passwordMatches } from "../../supabase/functions/_shared/repair-delete-rules";
describe("eliminación protegida", () => {
  it("rechaza contraseña incorrecta y configuración ausente", async () => {
    expect(await passwordMatches("wrong", "test-only-value")).toBe(false);
    expect(await passwordMatches("test-only-value", undefined)).toBe(false);
    expect(await passwordMatches("test-only-value", "test-only-value")).toBe(true);
  });
  it("conserva los permisos del propietario y administrador", () => {
    expect(canDeleteRepair("owner", "owner", false)).toBe(true);
    expect(canDeleteRepair("other", "owner", false)).toBe(false);
    expect(canDeleteRepair("admin", "owner", true)).toBe(true);
  });
});