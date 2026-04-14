import { Home, PlusCircle, Clock, Settings, Search, Shield } from "lucide-react";

interface BottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewRecord: () => void;
  showRoles?: boolean;
}

const navItems = [
  { key: "dashboard", label: "Inicio", icon: Home },
  { key: "historial", label: "Historial", icon: Clock },
  { key: "new", label: "Nuevo", icon: PlusCircle, isAction: true },
  { key: "roles", label: "Roles", icon: Shield, adminOnly: true },
  { key: "config", label: "Config", icon: Settings },
];

const BottomNav = ({ activeView, onViewChange, onNewRecord, showRoles = false }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border lg:hidden print:hidden safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.key;

          if (item.isAction) {
            return (
              <button
                key={item.key}
                onClick={onNewRecord}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={`flex flex-col items-center justify-center min-w-[60px] min-h-[44px] gap-0.5 transition-colors active:scale-95 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
