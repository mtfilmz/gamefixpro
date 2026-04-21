import { HardDrive, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const GoogleDriveConnectButton = () => {
  const handleClick = () => {
    toast({
      title: "Conexión con Google Drive",
      description: "Cuando autorices la conexión del proyecto, este botón quedará listo para usar los respaldos semanales.",
    });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30">
        <HardDrive className="w-4 h-4 text-muted-foreground" />
        <span className="font-bold text-sm text-foreground flex-1">Google Drive</span>
      </div>

      <div className="p-3 space-y-3">
        <p className="text-xs text-muted-foreground">
          Vincula la app con Google Drive para usar respaldos automáticos semanales.
        </p>

        <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={handleClick}>
          <Link2 className="w-4 h-4" />
          Conectar con Google Drive
        </Button>
      </div>
    </div>
  );
};

export default GoogleDriveConnectButton;