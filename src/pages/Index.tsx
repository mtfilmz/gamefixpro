import { useState } from "react";
import { Repair, EstadoReparacion } from "@/types/repair";
import { getRepairs, saveRepairs, generateId } from "@/lib/repairs";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import StatsCards from "@/components/StatsCards";
import RepairTable from "@/components/RepairTable";
import RepairForm from "@/components/RepairForm";
import QRTicketModal from "@/components/QRTicketModal";
import UpdateStatus from "@/components/UpdateStatus";

const Index = () => {
  const [repairs, setRepairs] = useState<Repair[]>(getRepairs);
  const [activeView, setActiveView] = useState("dashboard");
  const [formOpen, setFormOpen] = useState(false);
  const [editRepair, setEditRepair] = useState<Repair | null>(null);
  const [filterEstado, setFilterEstado] = useState<EstadoReparacion | "TODOS">("TODOS");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrRepair, setQrRepair] = useState<Repair | null>(null);
  const [statusRepair, setStatusRepair] = useState<Repair | null>(null);

  const handleSave = (data: Omit<Repair, "id"> & { id?: string }) => {
    let updated: Repair[];
    let savedRepair: Repair;
    if (data.id) {
      savedRepair = { ...data, id: data.id } as Repair;
      updated = repairs.map((r) => (r.id === data.id ? savedRepair : r));
    } else {
      savedRepair = { ...data, id: generateId(repairs) } as Repair;
      updated = [...repairs, savedRepair];
    }
    saveRepairs(updated);
    setRepairs(updated);
    setEditRepair(null);
    if (!data.id) {
      setQrRepair(savedRepair);
    }
  };

  const handleStatusSave = (updatedRepair: Repair) => {
    const updated = repairs.map((r) => (r.id === updatedRepair.id ? updatedRepair : r));
    saveRepairs(updated);
    setRepairs(updated);
    setStatusRepair(updatedRepair);
  };

  const openEdit = (r: Repair) => {
    setEditRepair(r);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditRepair(null);
    setFormOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeView={activeView} onViewChange={setActiveView} onNewRecord={openNew} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-background/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed z-40 lg:hidden">
            <Sidebar activeView={activeView} onViewChange={(v) => { setActiveView(v); setSidebarOpen(false); }} onNewRecord={() => { openNew(); setSidebarOpen(false); }} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3 md:p-6 overflow-auto pb-20 lg:pb-6">
          <StatsCards repairs={repairs} />
          <RepairTable
            repairs={repairs}
            onEdit={openEdit}
            onShowQR={setQrRepair}
            onUpdateStatus={setStatusRepair}
            filterEstado={filterEstado}
            onFilterChange={setFilterEstado}
          />
        </main>
        <footer className="text-center text-muted-foreground text-xs py-3 hidden lg:block">
          Sistema de Gestión v1.0 | Game Fix Pro
        </footer>
      </div>

      {/* Desktop FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg text-3xl font-bold items-center justify-center hover:scale-110 transition-transform z-20 print:hidden hidden lg:flex"
      >
        +
      </button>

      {/* Mobile bottom nav */}
      <BottomNav activeView={activeView} onViewChange={setActiveView} onNewRecord={openNew} />

      <RepairForm open={formOpen} onClose={() => { setFormOpen(false); setEditRepair(null); }} onSave={handleSave} editRepair={editRepair} repairs={repairs} />
      <QRTicketModal repair={qrRepair} open={!!qrRepair} onClose={() => setQrRepair(null)} />
      <UpdateStatus
        repair={statusRepair}
        open={!!statusRepair}
        onClose={() => setStatusRepair(null)}
        onSave={handleStatusSave}
        onShowQR={setQrRepair}
      />
    </div>
  );
};

export default Index;
