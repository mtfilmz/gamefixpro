import { useState, useEffect } from "react";
import { Repair, EstadoReparacion } from "@/types/repair";
import { fetchRemoteConfig } from "@/lib/config";
import { notifyNewRepair } from "@/lib/notifications";
import { useRepairs } from "@/hooks/use-repairs";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import StatsCards from "@/components/StatsCards";
import RepairTable from "@/components/RepairTable";
import RepairForm from "@/components/RepairForm";
import QRTicketModal from "@/components/QRTicketModal";
import UpdateStatus from "@/components/UpdateStatus";
import ConfigPanel from "@/components/ConfigPanel";
import { PaymentDraft } from "@/lib/payments";
import { recordPayment, syncPayment } from "@/lib/payment-service";
import { toast } from "sonner";
import RepairDetailsDialog from "@/components/RepairDetailsDialog";
import DeleteRepairsDialog from "@/components/DeleteRepairsDialog";
import ClientsPage from "@/components/ClientsPage";
import ActivityHistoryPage from "@/components/ActivityHistoryPage";

const Index = () => {
  const { repairs, loading, saveRepair, nextRepairId, deleteRepairs, refreshRepairs, setBusy } = useRepairs();
  const [activeView, setActiveView] = useState("dashboard");
  const [formOpen, setFormOpen] = useState(false);
  const [editRepair, setEditRepair] = useState<Repair | null>(null);
  const [prefillRepair, setPrefillRepair] = useState<Repair | null>(null);
  const [filterEstado, setFilterEstado] = useState<EstadoReparacion | "TODOS">("TODOS");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrRepair, setQrRepair] = useState<Repair | null>(null);
  const [statusRepair, setStatusRepair] = useState<Repair | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailRepair, setDetailRepair] = useState<Repair | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const requestDelete = (repair: Repair) => {
    setDetailRepair(null);
    setDeleteIds([repair.id]);
  };

  useEffect(() => {
    fetchRemoteConfig();
  }, []);

  // Pause auto-refresh while any modal is open
  const anyModalOpen = formOpen || !!qrRepair || !!statusRepair || !!detailRepair || deleteIds.length > 0;
  useEffect(() => {
    setBusy(anyModalOpen);
  }, [anyModalOpen, setBusy]);

  const handleSave = async (data: Omit<Repair, "id"> & { id?: string }, payment?: PaymentDraft) => {
    const isNew = !editRepair;
    let savedRepair: Repair = { ...data, id: data.id || "" } as Repair;
    // Orden nueva (no reabierta): el número lo da la nube, así dos equipos no repiten el mismo.
    if (isNew && !String(data.id || "").includes("-R")) {
      const asignado = await nextRepairId();
      if (data.id && asignado !== data.id) toast.info(`El número asignado es ${asignado}`);
      savedRepair = { ...data, id: asignado } as Repair;
    }
    // Se compara con cómo estaba la orden al abrirla para guardar solo lo que cambió.
    savedRepair = await saveRepair(savedRepair, editRepair);
    if (payment) {
      try {
        await recordPayment(savedRepair.id, payment);
      } catch (e) {
        throw new Error(
          `Equipo guardado; no se confirmó el pago. Reintenta sin cerrar: ${e instanceof Error ? e.message : "Error al guardar"}`,
        );
      }
      try {
        await syncPayment(payment.id);
        toast.success("Pago confirmado por Balans Board");
      } catch (e) {
        toast.warning(e instanceof Error ? e.message : "Pago guardado; envío pendiente");
      }
    }
    setEditRepair(null);
    await refreshRepairs();
    if (isNew) {
      notifyNewRepair(savedRepair.id, savedRepair.cliente);
      setQrRepair(savedRepair);
    }
  };

  const handleStatusSave = async (updatedRepair: Repair) => {
    const guardada = await saveRepair(updatedRepair, statusRepair);
    setStatusRepair(guardada);
  };

  const openEdit = (r: Repair) => {
    setEditRepair(r);
    setPrefillRepair(null);
    setFormOpen(true);
  };

  const openReopen = (r: Repair) => {
    setEditRepair(null);
    setPrefillRepair(r);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditRepair(null);
    setPrefillRepair(null);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground text-lg">Cargando datos...</div>
      </div>
    );
  }

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
            <Sidebar
              activeView={activeView}
              onViewChange={(v) => {
                setActiveView(v);
                setSidebarOpen(false);
              }}
              onNewRecord={() => {
                openNew();
                setSidebarOpen(false);
              }}
            />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onRefresh={refreshRepairs} />
        <main className="flex-1 p-3 md:p-6 overflow-auto pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-6">
          {activeView === "config" ? (
            <ConfigPanel repairs={repairs} onDeleteRepairs={(ids) => setDeleteIds(ids)} />
          ) : activeView === "actividad" ? (
            <ActivityHistoryPage />
          ) : activeView === "clientes" ? (
            <ClientsPage repairs={repairs} />
          ) : activeView === "historial" ? (
            <RepairTable
              repairs={repairs}
              onEdit={openEdit}
              onShowQR={setQrRepair}
              onUpdateStatus={setStatusRepair}
              onReopen={openReopen}
              filterEstado={filterEstado}
              onFilterChange={setFilterEstado}
              title="HISTORIAL COMPLETO"
              onDetails={setDetailRepair}
              onDelete={requestDelete}
            />
          ) : activeView === "buscar" ? (
            <div>
              <div className="bg-card border border-border rounded-xl p-4 mb-4">
                <label className="text-xs text-muted-foreground mb-1 block font-bold uppercase tracking-wide">
                  Buscar reparación
                </label>
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID, cliente, teléfono, consola, número de serie..."
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
                />
                {searchQuery && (
                  <p className="text-xs text-muted-foreground mt-2">Mostrando resultados para "{searchQuery}"</p>
                )}
              </div>
              <RepairTable
                repairs={repairs}
                onEdit={openEdit}
                onShowQR={setQrRepair}
                onUpdateStatus={setStatusRepair}
                onReopen={openReopen}
                filterEstado={filterEstado}
                onFilterChange={setFilterEstado}
                searchQuery={searchQuery}
                title="RESULTADOS"
                onDetails={setDetailRepair}
                onDelete={requestDelete}
              />
            </div>
          ) : (
            <>
              <StatsCards
                repairs={repairs}
                onSelectEstado={(estado) => {
                  setFilterEstado(estado);
                  setActiveView("historial");
                }}
              />
              <RepairTable
                repairs={repairs}
                onEdit={openEdit}
                onShowQR={setQrRepair}
                onUpdateStatus={setStatusRepair}
                onReopen={openReopen}
                filterEstado={filterEstado}
                onFilterChange={setFilterEstado}
                onDetails={setDetailRepair}
                onDelete={requestDelete}
              />
            </>
          )}
        </main>
        <footer className="text-center text-muted-foreground text-xs py-3 hidden lg:block">
          Sistema de Gestión v1.0 | Super Mobile Game Fix
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
      <RepairDetailsDialog repair={detailRepair} onClose={() => setDetailRepair(null)} />
      {deleteIds.length > 0 && (
        <DeleteRepairsDialog
          ids={deleteIds}
          onClose={() => setDeleteIds([])}
          onDelete={async (password) => {
            await deleteRepairs(deleteIds, password);
            toast.success("Registros eliminados. Pagos conservados.");
          }}
        />
      )}

      <RepairForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditRepair(null);
          setPrefillRepair(null);
        }}
        onSave={handleSave}
        editRepair={editRepair}
        prefillRepair={prefillRepair}
        repairs={repairs}
      />
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
