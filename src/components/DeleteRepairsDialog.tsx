import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

export default function DeleteRepairsDialog({ ids, onClose, onDelete }: { ids: string[]; onClose: () => void; onDelete: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="w-[calc(100%-2rem)]" onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} onPointerDownOutside={e => { if (busy) e.preventDefault(); }}>
    <DialogHeader><DialogTitle>Eliminar {ids.length} registro(s)</DialogTitle><DialogDescription>Esta acción no se puede deshacer. Los pagos registrados y los ingresos enviados a Balans Board se conservarán.</DialogDescription></DialogHeader>
    <p className="text-sm break-words">{ids.join(", ")}</p>
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(""); try { await onDelete(password); setPassword(""); onClose(); } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo eliminar"); setPassword(""); } finally { setBusy(false); } }}>
      <div className="space-y-2"><Label htmlFor="delete-password">Contraseña de eliminación</Label><Input id="delete-password" type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} maxLength={200} disabled={busy} autoFocus required /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" variant="destructive" disabled={busy || !password}><Trash2 className="h-4 w-4" />{busy ? "Eliminando…" : "Eliminar"}</Button></div>
    </form>
  </DialogContent></Dialog>;
}