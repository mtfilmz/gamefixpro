const CONFIG_KEY = "gamefixpro_config";

export interface AppConfig {
  marcas: string[];
  modelosPorMarca: Record<string, string[]>;
  problemas: string[];
  estados: string[];
  coloresPreset: string[];
  accesoriosPreset: string[];
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
};

export function getConfig(): AppConfig {
  const data = localStorage.getItem(CONFIG_KEY);
  if (!data) return { ...defaultConfig };
  try {
    const parsed = JSON.parse(data);
    return { ...defaultConfig, ...parsed };
  } catch {
    return { ...defaultConfig };
  }
}

export function saveConfig(config: AppConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function resetConfig(): AppConfig {
  localStorage.removeItem(CONFIG_KEY);
  return { ...defaultConfig };
}
