export interface ExportPayment {
  id: string; repair_id: string; client_name: string; equipment: string;
  amount: number | string; paid_on: string; method: string; client_phone?: string | null;
}
export function paymentPayload(payment: ExportPayment, bindingId: string) {
  return {
    version: 1, source_app: "gamefixpro", binding_id: bindingId,
    payment_id: payment.id, repair_id: payment.repair_id,
    client_name: payment.client_name, equipment: payment.equipment,
    ...(payment.client_phone != null ? { client_phone: payment.client_phone } : {}),
    amount: Number(payment.amount), paid_on: payment.paid_on, method: payment.method,
    type: "income", source: "business", category: "Reparaciones",
    description: `Pago de ${payment.client_name} — ${payment.equipment}`,
  };
}