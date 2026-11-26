import { useState, useEffect } from "react";
import { getConfig, saveConfig, resetConfig, AppConfig, Negocio, fetchRemoteConfig, saveRemoteConfig } from "@/lib/config";
import {
  Palette,
  Plug,
  Settings2,
  HardDrive,
  Wallet,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Store,
  Gamepad2,
  Tag,
  Package,
  Wrench,
  History,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Repair } from "@/types/repair";
import { useRole } from "@/hooks/use-role";
import UserRolesPanel from "@/components/UserRolesPanel";
import GoogleDriveConnectButton from "@/components/GoogleDriveConnectButton";
import FinanceAccountConnection from "@/components/FinanceAccountConnection";
import TechRepairClientConnection from "@/components/TechRepairClientConnection";

const TEMAS = [
  {
    id: "original",
    nombre: "Original",
    fondo: "hsl(233 50% 17%)",
    tarjeta: "hsl(225 45% 16%)",
    borde: "hsl(233 40% 50%)",
  },
  { id: "dark", nombre: "Dark", fondo: "hsl(0 0% 9%)", tarjeta: "hsl(0 0% 13%)", borde: "hsl(0 0% 40%)" },
  { id: "black", nombre: "Black", fondo: "hsl(0 0% 0%)", tarjeta: "hsl(0 0% 5%)", borde: "hsl(0 0% 34%)" },
  { id: "claro", nombre: "Claro", fondo: "hsl(220 25% 96%)", tarjeta: "hsl(0 0% 100%)", borde: "hsl(225 20% 68%)" },
] as const;
type TemaId = (typeof TEMAS)[number]["id"];
const TEMA_KEY = "gamefix-tema";

function leerTema(): TemaId {
  try {
    const guardado = localStorage.getItem(TEMA_KEY);
    const tema = TEMAS.find((t) => t.id === guardado);
    if (tema) return tema.id;
  } catch {
    // sin localStorage: se usa el tema original
  }
  return "original";
}

/** Apariencia de la app en este equipo (Original, Dark, Black o Claro). Se aplica al instante. */
const AparienciaSection = () => {
  const [tema, setTema] = useState<TemaId>(leerTema);

  const elegir = (id: TemaId) => {
    setTema(id);
    try {
      localStorage.setItem(TEMA_KEY, id);
    } catch {
      // sin localStorage: el tema se aplica solo hasta cerrar la app
    }
    if (id === "original") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = id;
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30">
        <Palette className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm text-foreground flex-1">Apariencia</span>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          Elige cómo se ve Gaming Fix en este equipo. El cambio es inmediato.
        </p>
        <div role="radiogroup" aria-label="Tema de la app" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TEMAS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={tema === t.id}
              onClick={() => elegir(t.id)}
              className={`rounded-xl border-2 p-2 text-left transition-colors ${tema === t.id ? "border-primary" : "border-border hover:border-muted-foreground"}`}
            >
              <span className="block h-12 rounded-lg p-2" style={{ background: t.fondo }}>
                <span
                  className="block h-full rounded-md border-2"
                  style={{ background: t.tarjeta, borderColor: t.borde }}
                />
              </span>
              <span className="mt-1.5 flex items-center justify-between text-sm font-semibold text-foreground">
                {t.nombre}
                {tema === t.id && <Check className="w-4 h-4 text-primary" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ForceUpdateSection = () => {
  const { signOut } = useAuth();

  const handleForceUpdate = async () => {
    toast({ title: "Actualizando...", description: "Limpiando caché y cerrando sesión." });
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations();
      if (registrations) {
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn("Error limpiando caches:", e);
    }
    await signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30">
        <RefreshCw className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm text-foreground flex-1">Forzar Actualización</span>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          Si la app no refleja los últimos cambios, presiona este botón para limpiar toda la caché, cerrar sesión y
          recargar desde cero.
        </p>
        <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={handleForceUpdate}>
          <RefreshCw className="w-3.5 h-3.5" />
          Forzar Actualización Completa
        </Button>
      </div>
    </div>
  );
};

const inputClass =
  "w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[40px]";

interface EditableListProps {
  title: string;
  icon?: LucideIcon;
  items: string[];
  onChange: (items: string[]) => void;
}

const EditableList = ({ title, icon: Icon, items, onChange }: EditableListProps) => {
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
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        {Icon ? <Icon className="w-4 h-4 text-primary" /> : null}
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
                className="record-highlight flex items-center gap-1.5 bg-muted/20 rounded-lg px-3 py-2 group"
              >
                {editIdx === idx ? (
                  <>
                    <input
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className={`${inputClass} flex-1`}
                      autoFocus
                      maxLength={100}
                    />
                    <button onClick={saveEdit} className="p-1 text-status-repaired hover:opacity-80">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="p-1 text-destructive hover:opacity-80">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground truncate">{item}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveItem(idx, -1)}
                        className="p-1 text-muted-foreground hover:text-foreground text-xs"
                        disabled={idx === 0}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveItem(idx, 1)}
                        className="p-1 text-muted-foreground hover:text-foreground text-xs"
                        disabled={idx === items.length - 1}
                      >
                        ▼
                      </button>
                      <button onClick={() => startEdit(idx)} className="p-1 text-muted-foreground hover:text-primary">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <Gamepad2 className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm text-foreground flex-1">Modelos por Marca</span>
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          {marcas.map((marca) => (
            <EditableList
              key={marca}
              title={marca}
              icon={Package}
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

const NegocioSection = ({ negocio, editable, onSave }: { negocio: Negocio; editable: boolean; onSave: (n: Negocio) => void }) => {
  const [form, setForm] = useState<Negocio>(negocio);
  useEffect(() => setForm(negocio), [negocio]);
  const campos: [keyof Negocio, string, string][] = [
    ["nombre", "Nombre del negocio", "Super Mobile Tech Repair"],
    ["direccion", "Dirección", "Calle, pueblo"],
    ["telefono", "Teléfono", "787-000-0000"],
    ["web", "Página web", "minegocio.com"],
    ["correo", "Correo", "correo@minegocio.com"],
    ["notaFactura", "Nota al final de la factura", "Ej.: Garantía de 30 días en la reparación"],
  ];
  const cambiado = JSON.stringify(form) !== JSON.stringify(negocio);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30">
        <Store className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm text-foreground flex-1">Datos del negocio</span>
      </div>
      <div className="p-3 space-y-3">
        <p className="text-xs text-muted-foreground">
          Así sale tu negocio en las facturas, en los mensajes y en la página que ve el cliente.
          {editable ? "" : " Solo un administrador puede cambiarlos."}
        </p>
        {campos.map(([key, label, ph]) => (
          <label key={key} className="block space-y-1">
            <span className="text-xs font-semibold text-foreground">{label}</span>
            {key === "notaFactura" ? (
              <textarea
                value={form[key]}
                disabled={!editable}
                placeholder={ph}
                rows={2}
                maxLength={300}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className={inputClass}
              />
            ) : (
              <input
                value={form[key]}
                disabled={!editable}
                placeholder={ph}
                maxLength={120}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className={inputClass}
              />
            )}
          </label>
        ))}
        {editable && (
          <Button
            size="sm"
            disabled={!cambiado || !form.nombre.trim()}
            onClick={() => onSave({ ...form, nombre: form.nombre.trim() })}
            className="gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Guardar datos del negocio
          </Button>
        )}
      </div>
    </div>
  );
};

interface ConfigPanelProps {
  repairs?: Repair[];
  onDeleteRepairs?: (ids: string[]) => void;
  /** Abre el historial de actividad (solo administradores). */
  onOpenActividad?: () => void;
}

const ConfigPanel = ({ repairs = [], onDeleteRepairs, onOpenActividad }: ConfigPanelProps) => {
  const [config, setConfig] = useState<AppConfig>(getConfig);
  const [section, setSection] = useState<"general" | "conexiones">("general");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { isAdmin } = useRole();

  const update = (partial: Partial<AppConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    saveConfig(updated);
    saveRemoteConfig(updated).catch((e) =>
      toast({
        title: "No se guardó en la nube",
        description: e instanceof Error ? e.message : "Solo un administrador puede cambiar la configuración",
        variant: "destructive",
      }),
    );
  };

  useEffect(() => {
    fetchRemoteConfig().then((c) => {
      if (c) setConfig(c);
    });
  }, []);

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
      saveRemoteConfig(def).catch(() => {});
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Ajustes</h2>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Restablecer
        </Button>
      </div>

      <div role="tablist" className="grid grid-cols-2 gap-1 p-1 bg-muted/40 rounded-xl">
        {(
          [
            ["general", "General", Settings2],
            ["conexiones", "Conexiones", Plug],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={section === key}
            onClick={() => setSection(key)}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${section === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {section === "conexiones" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cada conexión es independiente. Desconectar o cambiar una no afecta a las demás.
          </p>
          {(
            [
              [HardDrive, "Respaldos", "Copias de seguridad en Google Drive.", <GoogleDriveConnectButton key="d" />],
              [Wallet, "Pagos", "Envía los pagos registrados a Balans Board.", <FinanceAccountConnection key="f" />],
              [Users, "Clientes", "Comparte tus clientes con COBRO.", <TechRepairClientConnection key="t" />],
            ] as const
          ).map(([Icon, title, desc, node]) => (
            <section key={title} className="border border-border rounded-xl overflow-hidden bg-card">
              <header className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </header>
              <div className="p-4">{node}</div>
            </section>
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Personaliza las opciones del sistema. Los cambios se aplican inmediatamente.
          </p>

          <div className="space-y-3">
            <AparienciaSection />

            <NegocioSection
              negocio={config.negocio}
              editable={isAdmin}
              onSave={(negocio) => {
                update({ negocio });
                toast({ title: "Datos del negocio guardados" });
              }}
            />

            {isAdmin && onOpenActividad && (
              <button
                type="button"
                onClick={onOpenActividad}
                className="w-full border border-border rounded-xl px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center gap-2 text-left"
              >
                <History className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-foreground flex-1">Historial de actividad</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            )}

            <EditableList title="Marcas" icon={Tag} items={config.marcas} onChange={handleMarcasChange} />

            <ModelosEditor
              marcas={config.marcas}
              modelosPorMarca={config.modelosPorMarca}
              onChange={(modelosPorMarca) => update({ modelosPorMarca })}
            />

            <EditableList
              title="Problemas Reportados"
              icon={AlertTriangle}
              items={config.problemas}
              onChange={(problemas) => update({ problemas })}
            />

            <EditableList
              title="Estados de Reparación"
              icon={Wrench}
              items={config.estados}
              onChange={(estados) => update({ estados })}
            />

            <EditableList
              title="Colores Preset"
              icon={Palette}
              items={config.coloresPreset}
              onChange={(coloresPreset) => update({ coloresPreset })}
            />

            <EditableList
              title="Accesorios Preset"
              icon={Plug}
              items={config.accesoriosPreset}
              onChange={(accesoriosPreset) => update({ accesoriosPreset })}
            />

            {/* Data Management Section */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30">
                <Trash2 className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-foreground flex-1">Gestión de Equipos Registrados</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {repairs.length}
                </span>
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
                            setSelectedIds(e.target.checked ? new Set(repairs.map((r) => r.id)) : new Set());
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
                            onDeleteRepairs?.(Array.from(selectedIds));
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
                          className="record-highlight flex items-center gap-3 bg-muted/20 rounded-lg px-3 py-2 cursor-pointer"
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
                          onDeleteRepairs?.(repairs.map((r) => r.id));
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
        </>
      )}
    </div>
  );
};

export default ConfigPanel;
