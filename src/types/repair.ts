export type EstadoReparacion = "PENDIENTE" | "DIAGNÓSTICO" | "EN REPARACIÓN" | "REPARADO" | "ENTREGADO";

export interface StatusChange {
  estado: EstadoReparacion;
  fecha: string; // ISO timestamp
  nota?: string;
}

export interface RepairImage {
  id: string;
  dataUrl: string;
  fecha: string;
  nota?: string;
}

export interface Repair {
  id: string;
  cliente: string;
  telefono: string;
  email: string;
  marca: string;
  consola: string;
  numeroSerie: string;
  color: string;
  accesorios: string;
  problemas: string[];
  detalles: string;
  estado: EstadoReparacion;
  fecha: string;
  historial?: StatusChange[];
  imagenes?: RepairImage[];
}
