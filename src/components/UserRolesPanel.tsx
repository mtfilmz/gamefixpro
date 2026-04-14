import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Shield, UserPlus, Trash2 } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  email?: string;
}

const UserRolesPanel = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("tecnico");
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    const { data, error } = await supabase.from("user_roles").select("*");
    if (!error && data) {
      setRoles(data.map((r: any) => ({ ...r, email: "" })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAssignRole = async () => {
    if (!newEmail.trim()) {
      toast({ title: "Error", description: "Ingresa un correo electrónico", variant: "destructive" });
      return;
    }
    setSaving(true);

    toast({ title: "Info", description: "Para asignar roles, necesitas el ID del usuario. Usa el botón de copiar ID.", variant: "default" });
    setSaving(false);
  };

  const handleAssignByUserId = async (userId: string, role: string) => {
    setSaving(true);
    const { error } = await supabase.from("user_roles").upsert(
      [{ user_id: userId, role: role as "admin" | "tecnico" }],
      { onConflict: "user_id,role" }
    );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rol asignado", description: `Rol ${role} asignado correctamente.` });
      fetchRoles();
    }
    setSaving(false);
  };

  const handleDeleteRole = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rol eliminado" });
      fetchRoles();
    }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as "admin" | "tecnico" }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rol actualizado" });
      fetchRoles();
    }
  };

  if (loading) {
    return <div className="text-muted-foreground p-4">Cargando roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Gestión de Roles</h2>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Asignar nuevo rol</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="ID del usuario (UUID)"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (newEmail.trim()) {
                handleAssignByUserId(newEmail.trim(), newRole);
                setNewEmail("");
              }
            }}
            disabled={saving || !newEmail.trim()}
            size="sm"
            className="gap-1"
          >
            <UserPlus className="h-4 w-4" />
            Asignar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          El ID del usuario aparece en el Header cuando inician sesión. Pídeles que te lo compartan.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-4 py-2 font-bold text-foreground">User ID</th>
              <th className="px-4 py-2 font-bold text-foreground">Rol</th>
              <th className="px-4 py-2 font-bold text-foreground text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                  No hay roles asignados aún
                </td>
              </tr>
            ) : (
              roles.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 text-foreground font-mono text-xs truncate max-w-[200px]">
                    {r.user_id}
                  </td>
                  <td className="px-4 py-2">
                    <Select
                      value={r.role}
                      onValueChange={(val) => handleChangeRole(r.id, val)}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteRole(r.id)}
                      className="gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserRolesPanel;
