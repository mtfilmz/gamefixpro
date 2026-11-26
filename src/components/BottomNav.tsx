import { Home, Plus, ClipboardList, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewRecord: () => void;
}

// "también" = otras vistas que viven dentro de esa sección (para marcarla como activa).
type NavItem = { key: string; label: string; icon: typeof Home; tambien?: string[] };

// 4 secciones, como piden las guías de Google para la barra de abajo. El + va en el centro.
const navItems: NavItem[] = [
  { key: "dashboard", label: "Inicio", icon: Home },
  { key: "historial", label: "Órdenes", icon: ClipboardList, tambien: ["buscar"] },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "config", label: "Ajustes", icon: Settings, tambien: ["actividad"] },
];

const BottomNav = ({ activeView, onViewChange, onNewRecord }: BottomNavProps) => {
  const items = navItems;
  // El botón + va siempre en el centro exacto: la mitad de las secciones a cada lado.
  const mitad = Math.ceil(items.length / 2);
  const izquierda = items.slice(0, mitad);
  const derecha = items.slice(mitad);

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeView === item.key || (item.tambien?.includes(activeView) ?? false);
    return (
      <Button
        variant="ghost"
        key={item.key}
        onClick={() => onViewChange(item.key)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center min-w-0 flex-1 px-0.5 h-14 gap-0.5 transition-colors active:scale-95",
          isActive ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="w-5 h-5" />
        <span className="text-[11px] font-bold truncate max-w-full">{item.label}</span>
      </Button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border lg:hidden print:hidden safe-bottom">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center h-16 px-1">
        <div className="flex items-center min-w-0">{izquierda.map(renderItem)}</div>
        <button
          type="button"
          onClick={onNewRecord}
          aria-label="Nueva orden"
          title="Nueva orden"
          className="flex items-center justify-center px-2 -mt-6"
        >
          <span className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg ring-4 ring-background active:scale-95 transition-transform">
            <Plus className="w-7 h-7 text-primary-foreground" />
          </span>
        </button>
        <div className="flex items-center min-w-0">{derecha.map(renderItem)}</div>
      </div>
    </nav>
  );
};

export default BottomNav;
