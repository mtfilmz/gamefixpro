import { useState } from "react";
import { Repair, EstadoReparacion } from "@/types/repair";
import { getRepairs, saveRepairs, generateId } from "@/lib/repairs";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import RepairTable from "@/components/RepairTable";
import RepairForm from "@/components/RepairForm";

const Index = () => {
  const [repairs, setRepairs] = useState<Repair[]>(getRepairs);
  const [activeView, setActiveView] = useState("dashboard");
  const [formOpen, setFormOpen] = useState(false);
  const [editRepair, setEditRepair] = useState<Repair | null>(null);
  const [filterEstado, setFilterEstado] = useState<EstadoReparacion | "TODOS">("TODOS");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSave = (data: Omit<Repair, "id"> & { id?: string }) => {
    let updated: Repair[];
    if (data.id) {
      updated = repairs.map((r) => (r.id === data.id ? { ...r, ...data, id: r.id } : r));
    } else {
      const newRepair: Repair = { ...data, id: generateId(repairs) } as Repair;
      updated = [...repairs, newRepair];
    }
    saveRepairs(updated);
    setRepairs(updated);
    setEditRepair(null);
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
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
      >
        ☰
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed lg:static z-40 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar activeView={activeView} onViewChange={(v) => { setActiveView(v); setSidebarOpen(false); }} onNewRecord={openNew} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <StatsCards repairs={repairs} />
          <RepairTable repairs={repairs} onEdit={openEdit} filterEstado={filterEstado} onFilterChange={setFilterEstado} />
        </main>
        <footer className="text-center text-muted-foreground text-xs py-3">
          Sistema de Gestión v1.0 | Game Fix Pro
        </footer>
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg text-3xl font-bold flex items-center justify-center hover:scale-110 transition-transform z-20"
      >
        +
      </button>

      <RepairForm open={formOpen} onClose={() => { setFormOpen(false); setEditRepair(null); }} onSave={handleSave} editRepair={editRepair} />
    </div>
  );
};

export default Index;
