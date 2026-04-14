export type EstadoReparacion = "PENDIENTE" | "DIAGNÓSTICO" | "EN REPARACIÓN" | "REPARADO" | "ENTREGADO";

export interface Repair {
  id: string;
  cliente: string;
  consola: string;
  problema: string;
  estado: EstadoReparacion;
  fecha: string;
}
