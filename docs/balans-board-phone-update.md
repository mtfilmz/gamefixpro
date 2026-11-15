# Actualización requerida en Balans Board

Los pagos nuevos de Game Fix Pro incluyen `client_phone`, congelado al registrar el pago. Los pagos anteriores y de prueba mantienen el contrato anterior sin ese campo; no modificar sus recibos ni movimientos.

En Balans Board:
- `supabase/functions/_shared/financePaymentRules.ts`: admitir `client_phone` opcional de tipo string (máximo 20 caracteres, incluido vacío si falta el teléfono), manteniendo la validación estricta del resto de campos. Actualizar la interfaz y lista de campos permitidos sin exigirlo para pagos antiguos.
- `receive-repair-payment`: conservar el campo en el payload validado y en el recibo original. Mantener la deduplicación y el rechazo de cambios en pagos recibidos; no cambiar importes, permisos ni vínculos.
- `payment-details`: devolver `client_phone` desde el payload del recibo, nunca desde datos editables del cliente.
- En todos los detalles de ingresos (incluyendo móvil) mostrar el teléfono recibido, o «No enviado por Console Care Connect» cuando no exista.
- Probar recepción con teléfono, contrato antiguo sin teléfono, prueba sin teléfono, reintento idéntico sin duplicado y rechazo de un teléfono modificado con el mismo UUID.

Hasta actualizar el receptor, los pagos nuevos con teléfono pueden ser rechazados con 400 y permanecen pendientes en Game Fix Pro. No eliminar client_phone como alternativa ni reenviar pagos ya sincronizados.