import { useState, useRef } from "react";
import { EstadoReparacion } from "@/types/repair";
import { Camera } from "lucide-react";

const LOGO_KEY = "gfp-logo";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewRecord: () => void;
}

const Sidebar = ({ activeView, onViewChange, onNewRecord }: SidebarProps) => {
  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem(LOGO_KEY));
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem(LOGO_KEY, dataUrl);
      setLogo(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: ">>" },
    { key: "historial", label: "Historial", icon: "||" },
    { key: "roles", label: "Roles", icon: "⚙" },
    { key: "config", label: "Configuración", icon: "*" },
  ];

  return (
    <aside className="w-60 min-h-screen bg-sidebar border-r-2 border-sidebar-border flex flex-col items-center py-8 gap-6 shrink-0">
      <div
        className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center border-[3px] border-primary-foreground cursor-pointer group overflow-hidden"
        onClick={() => fileRef.current?.click()}
        title="Cambiar logo"
      >
        {logo ? (
          <img src={logo} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-primary-foreground">GF</span>
        )}
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-5 h-5 text-foreground" />
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
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
