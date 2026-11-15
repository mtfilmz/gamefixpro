import { describe, it, expect } from "vitest";
import { canReadActivity } from "@/lib/activity-history";
import { readFileSync } from "node:fs";

describe("historial administrativo", () => {
  it("solo admite administradores", () => {
    expect(canReadActivity("admin")).toBe(true);
    expect(canReadActivity("tecnico")).toBe(false);
    expect(canReadActivity(null)).toBe(false);
  });
  it("audita todas las tablas operativas y mantiene lectura exclusiva para admin", () => {
    const sql = readFileSync("drizzle/migrations/0006_admin_activity_history.sql", "utf8");
    for (const table of ["repairs", "clients", "repair_payments", "finance_account_links", "user_roles", "app_settings", "backup_settings", "backup_runs", "repair_delete_attempts"]) {
      expect(sql).toContain(`ON public.${table} FOR EACH ROW EXECUTE FUNCTION public.capture_activity_history()`);
    }
    expect(sql).toContain("USING(public.has_role(auth.uid(),'admin'::public.app_role))");
    expect(sql).not.toContain("GRANT UPDATE");
    expect(sql).not.toContain("GRANT DELETE");
  });
});