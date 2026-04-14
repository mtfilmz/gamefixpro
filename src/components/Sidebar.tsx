import { useState } from "react";
import { EstadoReparacion } from "@/types/repair";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewRecord: () => void;
}

const Sidebar = ({ activeView, onViewChange, onNewRecord }: SidebarProps) => {
  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: ">>" },
    { key: "historial", label: "Historial", icon: "||" },
    { key: "config", label: "Configuración", icon: "*" },
  ];

  return (
    <aside className="w-60 min-h-screen bg-sidebar border-r-2 border-sidebar-border flex flex-col items-center py-8 gap-6 shrink-0">
      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center border-[3px] border-primary-foreground">
        <span className="text-2xl font-bold text-primary-foreground">GF</span>
      </div>

      <button
        onClick={onNewRecord}
        className="text-foreground font-bold text-sm hover:text-primary transition-colors"
      >
        + Nuevo Registro
      </button>

      <nav className="flex flex-col gap-2 w-full px-4 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onViewChange(item.key)}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold text-left transition-colors ${
              activeView === item.key
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
