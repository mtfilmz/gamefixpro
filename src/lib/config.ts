const CONFIG_KEY = "gamefixpro_config";

/** Datos del negocio que salen en las facturas, los mensajes y la página del cliente. */
export interface Negocio {
  nombre: string;
  direccion: string;
  telefono: string;
  web: string;
  correo: string;
  notaFactura: string;
}

export const negocioPorDefecto: Negocio = {
  nombre: "Super Mobile Tech Repair",
  direccion: "PR-185 Km 5.0, Campo Rico, Canóvanas",
  telefono: "787-500-1324",
  web: "reparaciondecelularespr.com",
  correo: "",
  notaFactura: "Presupuesto de servicio; no acredita pago ni sustituye una factura fiscal.",
};

export interface AppConfig {
  marcas: string[];
  modelosPorMarca: Record<string, string[]>;
  problemas: string[];
  estados: string[];
  coloresPreset: string[];
  accesoriosPreset: string[];
  negocio: Negocio;
}

const defaultConfig: AppConfig = {
  marcas: ["Sony", "Microsoft", "Nintendo"],
  modelosPorMarca: {
    Sony: ["PS5", "PS5 Digital", "PS4 Pro", "PS4 Slim", "PS4", "PS3"],
    Microsoft: ["Xbox Series X", "Xbox Series S", "Xbox One X", "Xbox One S", "Xbox One"],
    Nintendo: ["Nintendo Switch", "Nintendo Switch OLED", "Nintendo Switch Lite", "Wii U", "3DS"],
  },
  problemas: [
    "Solo Diagnóstico",
    "Mantenimiento",
    "No enciende",
    "Daño por líquido",
    "Sufrió caída",
    "Sobrecalentamiento",
    "Subida de luz",
    "Se apaga jugando",
    "Se apaga con juegos pesados",
    "Se congela/Freezes",
    "No lee discos",
    "Problemas de conexión",
  ],
  estados: ["PENDIENTE", "DIAGNÓSTICO", "EN REPARACIÓN", "REPARADO", "ENTREGADO"],
  coloresPreset: ["Negro", "Blanco", "Gris", "Azul", "Rojo", "Neón"],
  accesoriosPreset: ["1 Control", "2 Controles", "Dock", "Joy-Cons", "Cable HDMI", "Fuente de poder", "Ninguno"],
  negocio: negocioPorDefecto,
};

// Une lo guardado con los valores por defecto (también dentro de los datos del negocio).
function completar(guardado: Partial<AppConfig> | null | undefined): AppConfig {
  const g = guardado || {};
  return { ...defaultConfig, ...g, negocio: { ...negocioPorDefecto, ...(g.negocio || {}) } };
}

export function getNegocio(): Negocio {
  return getConfig().negocio;
}

export function getConfig(): AppConfig {
  const data = localStorage.getItem(CONFIG_KEY);
  if (!data) return completar(null);
  try {
    return completar(JSON.parse(data));
  } catch {
    return completar(null);
  }
}

export function saveConfig(config: AppConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function resetConfig(): AppConfig {
  localStorage.removeItem(CONFIG_KEY);
  return completar(null);
}

// Cloud sync: settings live in the shared app_settings row so they persist across devices/sessions.
import { supabase } from "@/integrations/supabase/client";

export async function fetchRemoteConfig(): Promise<AppConfig | null> {
  const { data, error } = await supabase.from("app_settings").select("config").eq("singleton_key", true).maybeSingle();
  if (error || !data?.config) return null;
  const merged = completar(data.config as Partial<AppConfig>);
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
  return merged;
}

export async function saveRemoteConfig(config: AppConfig): Promise<void> {
  const { data: existing } = await supabase.from("app_settings").select("id").eq("singleton_key", true).maybeSingle();
  const payload = JSON.parse(JSON.stringify(config));
  const { error } = existing
    ? await supabase.from("app_settings").update({ config: payload }).eq("id", existing.id)
    : await supabase.from("app_settings").insert({ config: payload, singleton_key: true });
  if (error) throw new Error(error.message);
}
