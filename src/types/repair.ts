export type EstadoReparacion = "PENDIENTE" | "DIAGNÓSTICO" | "EN REPARACIÓN" | "REPARADO" | "ENTREGADO";

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
}
