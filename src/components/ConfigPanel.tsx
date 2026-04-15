import { useState } from "react";
import { getConfig, saveConfig, resetConfig, AppConfig } from "@/lib/config";
import { Plus, Trash2, Edit2, Check, X, RotateCcw, ChevronDown, ChevronRight, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Repair } from "@/types/repair";
import { useRole } from "@/hooks/use-role";
import UserRolesPanel from "@/components/UserRolesPanel";

const inputClass =
  "w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[40px]";

interface EditableListProps {
  title: string;
  icon: string;
  items: string[];
  onChange: (items: string[]) => void;
}

const EditableList = ({ title, icon, items, onChange }: EditableListProps) => {
  const [newItem, setNewItem] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");
  const [expanded, setExpanded] = useState(false);

  const addItem = () => {
    const val = newItem.trim();
    if (!val || items.includes(val)) return;
    onChange([...items, val]);
    setNewItem("");
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const startEdit = (idx: number) => {
    setEditIdx(idx);
    setEditVal(items[idx]);
  };

  const saveEdit = () => {
    if (editIdx === null) return;
    const val = editVal.trim();
    if (!val) return;
    const updated = [...items];
    updated[editIdx] = val;
    onChange(updated);
    setEditIdx(null);
    setEditVal("");
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditVal("");
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const updated = [...items];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    onChange(updated);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm">{icon}</span>
        <span className="font-bold text-sm text-foreground flex-1">{title}</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
      </button>

      {expanded && (
        <div className="p-3 space-y-2">
          {/* Add new */}
          <div className="flex gap-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Agregar nuevo..."
              className={inputClass}
              maxLength={100}
            />
            <Button size="sm" onClick={addItem} disabled={!newItem.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Items list */}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {items.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                className="flex items-center gap-1.5 bg-muted/20 rounded-lg px-3 py-2 group"
              >
                {editIdx === idx ? (
                  <>
                    <input
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                      className={`${inputClass} flex-1`}
                      autoFocus
                      maxLength={100}
                    />
                    <button onClick={saveEdit} className="p-1 text-status-repaired hover:opacity-80"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="p-1 text-destructive hover:opacity-80"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground truncate">{item}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveItem(idx, -1)} className="p-1 text-muted-foreground hover:text-foreground text-xs" disabled={idx === 0}>▲</button>
                      <button onClick={() => moveItem(idx, 1)} className="p-1 text-muted-foreground hover:text-foreground text-xs" disabled={idx === items.length - 1}>▼</button>
                      <button onClick={() => startEdit(idx)} className="p-1 text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeItem(idx)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No hay elementos. Agrega uno arriba.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ModelosEditorProps {
  marcas: string[];
  modelosPorMarca: Record<string, string[]>;
  onChange: (modelosPorMarca: Record<string, string[]>) => void;
}

const ModelosEditor = ({ marcas, modelosPorMarca, onChange }: ModelosEditorProps) => {
  const [expanded, setExpanded] = useState(false);

  const handleModelsChange = (marca: string, models: string[]) => {
    onChange({ ...modelosPorMarca, [marca]: models });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm">🎮</span>
        <span className="font-bold text-sm text-foreground flex-1">Modelos por Marca</span>
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          {marcas.map((marca) => (
            <EditableList
              key={marca}
              title={marca}
              icon="📦"
              items={modelosPorMarca[marca] || []}
              onChange={(models) => handleModelsChange(marca, models)}
            />
          ))}
          {marcas.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Agrega marcas primero.</p>
          )}
        </div>
      )}
    </div>
  );
};

interface ConfigPanelProps {
  repairs?: Repair[];
  onDeleteRepairs?: (ids: string[]) => void;
}

const ConfigPanel = ({ repairs = [], onDeleteRepairs }: ConfigPanelProps) => {
  const [config, setConfig] = useState<AppConfig>(getConfig);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { isAdmin } = useRole();

  const update = (partial: Partial<AppConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleMarcasChange = (marcas: string[]) => {
    // Clean up modelosPorMarca: remove models for deleted brands, add empty for new
    const newModelos = { ...config.modelosPorMarca };
    // Remove deleted brands
    Object.keys(newModelos).forEach((k) => {
      if (!marcas.includes(k)) delete newModelos[k];
    });
    // Add new brands
    marcas.forEach((m) => {
      if (!newModelos[m]) newModelos[m] = [];
    });
    update({ marcas, modelosPorMarca: newModelos });
  };

  const handleReset = () => {
    if (confirm("¿Restablecer toda la configuración a los valores por defecto?")) {
      const def = resetConfig();
      setConfig(def);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">⚙️ Configuración</h2>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Restablecer
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Personaliza las opciones del sistema. Los cambios se aplican inmediatamente.
      </p>

      <div className="space-y-3">
        <EditableList
          title="Marcas"
          icon="🏷️"
          items={config.marcas}
          onChange={handleMarcasChange}
        />

        <ModelosEditor
          marcas={config.marcas}
          modelosPorMarca={config.modelosPorMarca}
          onChange={(modelosPorMarca) => update({ modelosPorMarca })}
        />

        <EditableList
          title="Problemas Reportados"
          icon="⚠️"
          items={config.problemas}
          onChange={(problemas) => update({ problemas })}
        />

        <EditableList
          title="Estados de Reparación"
          icon="🔧"
          items={config.estados}
          onChange={(estados) => update({ estados })}
        />

        <EditableList
          title="Colores Preset"
          icon="🎨"
          items={config.coloresPreset}
          onChange={(coloresPreset) => update({ coloresPreset })}
        />

        <EditableList
          title="Accesorios Preset"
          icon="🔌"
          items={config.accesoriosPreset}
          onChange={(accesoriosPreset) => update({ accesoriosPreset })}
        />

        {/* Data Management Section */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30">
            <span className="text-sm">🗑️</span>
            <span className="font-bold text-sm text-foreground flex-1">Gestión de Equipos Registrados</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{repairs.length}</span>
          </div>
          <div className="p-3 space-y-3">
            {repairs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No hay equipos registrados.</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === repairs.length && repairs.length > 0}
                      onChange={(e) => {
                        setSelectedIds(e.target.checked ? new Set(repairs.map(r => r.id)) : new Set());
                      }}
                      className="rounded"
                    />
                    Seleccionar todos
                  </label>
                  {selectedIds.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-auto gap-1.5"
                      onClick={() => {
                        if (confirm(`¿Eliminar ${selectedIds.size} equipo(s)? Esta acción no se puede deshacer.`)) {
                          onDeleteRepairs?.(Array.from(selectedIds));
                          setSelectedIds(new Set());
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar ({selectedIds.size})
                    </Button>
                  )}
                </div>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {repairs.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-center gap-3 bg-muted/20 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          e.target.checked ? next.add(r.id) : next.delete(r.id);
                          setSelectedIds(next);
                        }}
                        className="rounded"
                      />
                      <span className="font-mono text-xs font-bold text-foreground">{r.id}</span>
                      <span className="text-sm text-foreground truncate flex-1">{r.cliente}</span>
                      <span className="text-xs text-muted-foreground">{r.consola}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => {
                      if (confirm("¿Eliminar TODOS los equipos registrados? Esta acción no se puede deshacer.")) {
                        onDeleteRepairs?.(repairs.map(r => r.id));
                        setSelectedIds(new Set());
                      }
                    }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Eliminar todos los equipos
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Force Update Section */}
        <ForceUpdateSection />

        {/* Roles section - only for admins */}
        {isAdmin && (
          <div className="pt-2">
            <UserRolesPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;
