import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canInstall, promptInstall } from "@/lib/pwa-utils";

const Header = () => {
  const [installable, setInstallable] = useState(canInstall());

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
      <span className="text-xl font-bold text-primary-foreground hidden md:inline">[&gt;]</span>
      <h1 className="text-base md:text-xl font-bold text-primary-foreground truncate flex-1">
        <span className="md:hidden">Game Fix Pro</span>
        <span className="hidden md:inline">GAME FIX PRO - Sistema de Reparación de Consolas</span>
      </h1>
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
    </header>
  );
};

export default Header;
