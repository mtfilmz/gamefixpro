import { useState, useEffect } from "react";
import { Download, LogOut, RefreshCw, Gamepad2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canInstall, promptInstall } from "@/lib/pwa-utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

interface HeaderProps {
  onRefresh?: () => void;
}

const Header = ({ onRefresh }: HeaderProps) => {
  const [installable, setInstallable] = useState(canInstall());
  const { signOut, user } = useAuth();

  useEffect(() => {
    const onAvailable = () => setInstallable(true);
    const onInstalled = () => setInstallable(false);
    window.addEventListener("pwa-install-available", onAvailable);
    window.addEventListener("pwa-installed", onInstalled);
    return () => {
      window.removeEventListener("pwa-install-available", onAvailable);
      window.removeEventListener("pwa-installed", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setInstallable(false);
  };

  return (
    <header className="w-full bg-primary py-3 px-4 md:px-6 flex items-center gap-3">
      <Gamepad2 className="w-6 h-6 text-primary-foreground hidden md:inline shrink-0" aria-hidden="true" />
      <h1 className="text-base md:text-xl font-bold text-primary-foreground min-w-0 break-words flex-1">
        Gaming Fix
      </h1>
      {user && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(user.id);
            toast({ title: "ID copiado", description: "Tu ID de usuario se copió al portapapeles." });
          }}
          className="text-primary-foreground/70 text-xs hidden sm:inline truncate max-w-[200px] hover:text-primary-foreground cursor-pointer"
          title="Clic para copiar tu ID de usuario"
        >
          {user.email} <Copy className="inline w-3 h-3 ml-1 -mt-0.5" aria-hidden="true" />
        </button>
      )}
      {onRefresh && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            onRefresh();
            toast({ title: "Actualizado", description: "Lista de reparaciones actualizada." });
          }}
          className="shrink-0 gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      )}
      {installable && (
        <Button
          size="sm"
          variant="secondary"
          onClick={handleInstall}
          className="shrink-0 gap-1.5"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Instalar App</span>
        </Button>
      )}
      {user && (
        <Button
          size="sm"
          variant="secondary"
          onClick={signOut}
          className="shrink-0 gap-1.5"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      )}
    </header>
  );
};

export default Header;
