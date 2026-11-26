import { Repair } from "@/types/repair";
import { getNegocio } from "@/lib/config";

// A share action must never download as a fallback.
export async function shareReceipt(api: Partial<Pick<Navigator, "share" | "canShare">>, file: File, title: string, text: string, url: string): Promise<"shared" | "options" | "cancelled"> {
  if (!api.share) return "options";
  try {
    const data = api.canShare?.({ files: [file] }) ? { title, text, files: [file] } : { title, text, url };
    await api.share(data);
    return "shared";
  } catch (error) {
    return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError" ? "cancelled" : "options";
  }
}

export function repairTotal(repair: Repair): number {
  return (repair.costoReparacion ?? 0) + (repair.costoComponente ?? 0) - (repair.costoDiagnostico ?? 0);
}

export function repairMessage(repair: Repair, url: string): string {
  return `${getNegocio().nombre} — ${repair.id}\nCliente: ${repair.cliente}\nEquipo: ${repair.marca} — ${repair.consola}\nEstado: ${repair.estado}\nTotal presupuestado: $${repairTotal(repair).toFixed(2)}\nSeguimiento: ${url}`;
}

export function smsLink(phone: string, message: string, userAgent: string): string | null {
  const trimmed = phone.trim();
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  const recipient = `${trimmed.startsWith("+") ? "+" : ""}${digits}`;
  const apple = /iPhone|iPad|iPod/.test(userAgent) || /Macintosh/.test(userAgent);
  return `sms:${recipient}${apple ? "&" : "?"}body=${encodeURIComponent(message)}`;
}
