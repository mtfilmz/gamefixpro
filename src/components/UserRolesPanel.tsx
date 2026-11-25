import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Shield, UserPlus, Trash2, Copy, Crown, Wrench, Check, X } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROLES = [
  { value: "admin", label: "Admin", detalle: "Acceso completo", icon: Crown },
  { value: "tecnico", label: "Técnico", detalle: "Cuenta de empleado", icon: Wrench },
] as const;

const fieldClass =
  "w-full h-11 bg-input border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

function idCorto(id: string) {
  return id.length > 14 ? id.slice(0, 8) + "…" + id.slice(-4) : id;
}

const UserRolesPanel = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<string>("tecnico");
  const [saving, setSaving] = useState(false);
  const [confirmarId, setConfirmarId] = useState<string | null>(null);

  const fetchRoles = async () => {
    const { data, error } = await supabase.from("user_roles").select("*");
    if (!error && data) setRoles(data as UserRole[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const idEscrito = newUserId.trim();
  const idValido = UUID.test(idEscrito);

  const handleAssign = async () => {
    if (!idValido) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_roles")
      .upsert([{ user_id: idEscrito, role: newRole as "admin" | "tecnico" }], { onConflict: "user_id,role" });
    if (error) {
      toast({ title: "No se pudo asignar", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Rol asignado",
        description: "Ya tiene el rol " + (newRole === "admin" ? "Admin" : "Técnico") + ".",
      });
      setNewUserId("");
      fetchRoles();
    }
    setSaving(false);
  };

  const handleDeleteRole = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) {
      toast({ title: "No se pudo quitar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Acceso quitado" });
      fetchRoles();
    }
    setConfirmarId(null);
  };

  const handleChangeRole = async (id: string, role: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: role as "admin" | "tecnico" })
      .eq("id", id);
    if (error) {
      toast({ title: "No se pudo cambiar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rol actualizado" });
      fetchRoles();
    }
  };

  const copiar = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast({ title: "ID copiado" });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-muted-foreground p-4">Cargando usuarios...</div>;
  }

  return (
    <section className="space-y-4">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground leading-tight">Usuarios y permisos</h2>
          <p className="text-xs text-muted-foreground">Decide quién entra a Game Fix y qué rol tiene.</p>
        </div>
      </header>

      {/* Agregar técnico o admin */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
          <UserPlus className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Agregar técnico o admin</h3>
        </div>
        <div className="p-4 space-y-4">
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
            <li>La persona inicia sesión en Game Fix con su cuenta.</li>
            <li>Toca su ID arriba, en el encabezado, para copiarlo y te lo envía.</li>
            <li>Lo pegas aquí, eliges el rol y tocas Asignar rol.</li>
          </ol>

          <div className="space-y-1.5">
            <label htmlFor="rol-user-id" className="text-xs font-semibold text-foreground">
              ID del usuario
            </label>
            <input
              id="rol-user-id"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className={cn(
                fieldClass,
                "font-mono",
                idEscrito && !idValido && "border-destructive focus:ring-destructive",
              )}
            />
            {idEscrito && !idValido && (
              <p className="text-xs text-destructive">Ese ID no está completo. Cópialo tal cual desde el encabezado.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Rol</span>
            <div role="radiogroup" aria-label="Rol" className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const activo = newRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    onClick={() => setNewRole(r.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left transition-colors",
                      activo ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", activo ? "text-primary" : "text-muted-foreground")} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{r.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{r.detalle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleAssign} disabled={saving || !idValido} className="w-full h-11 gap-2">
            <UserPlus className="h-4 w-4" />
            {saving ? "Asignando..." : "Asignar rol"}
          </Button>
        </div>
      </div>

      {/* Usuarios con acceso */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Usuarios con acceso</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{roles.length}</span>
        </div>
        {roles.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No hay roles asignados aún.</p>
        ) : (
          <ul className="divide-y divide-border">
            {roles.map((r) => {
              const esYo = r.user_id === user?.id;
              const info = ROLES.find((x) => x.value === r.role) ?? ROLES[1];
              const Icon = info.icon;
              return (
                <li key={r.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        r.role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {esYo ? "Tú" + (user?.email ? " · " + user.email : "") : info.label}
                      </p>
                      <button
                        type="button"
                        onClick={() => copiar(r.user_id)}
                        title="Copiar ID completo"
                        aria-label={"Copiar ID " + r.user_id}
                        className="flex items-center gap-1 text-xs text-muted-foreground font-mono hover:text-foreground"
                      >
                        {idCorto(r.user_id)}
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {confirmarId === r.id ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                      <p className="text-sm text-foreground flex-1">¿Quitarle el acceso a este usuario?</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmarId(null)}
                          className="flex-1 sm:flex-none gap-1"
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRole(r.id)}
                          className="flex-1 sm:flex-none gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Quitar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={r.role}
                        disabled={esYo}
                        onChange={(e) => handleChangeRole(r.id, e.target.value)}
                        aria-label="Rol del usuario"
                        className={cn(fieldClass, "flex-1 h-10 disabled:opacity-60")}
                      >
                        <option value="admin">Admin</option>
                        <option value="tecnico">Técnico</option>
                      </select>
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={esYo}
                        onClick={() => setConfirmarId(r.id)}
                        title={esYo ? "No puedes quitarte tu propio acceso" : "Quitar acceso"}
                        aria-label="Quitar acceso"
                        className="h-10 w-10 shrink-0 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {esYo && (
                    <p className="text-[11px] text-muted-foreground">
                      Tu propio rol no se cambia desde aquí, para que no pierdas el acceso.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default UserRolesPanel;
