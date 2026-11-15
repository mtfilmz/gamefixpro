export const activityEntities: Record<string, string> = {
  repairs: "Reparaciones", clients: "Clientes", repair_payments: "Pagos",
  finance_account_links: "Vinculación financiera", user_roles: "Roles",
  app_settings: "Configuración", backup_settings: "Configuración de respaldos",
  backup_runs: "Respaldos", repair_delete_attempts: "Intentos de eliminación",
};
export const activityOperations: Record<string, string> = { INSERT: "Creación", UPDATE: "Actualización", DELETE: "Eliminación" };
export function canReadActivity(role: string | null): boolean { return role === "admin"; }