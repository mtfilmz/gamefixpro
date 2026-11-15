# Prompt para pegar en el chat de Balans Board

Conecta esta app financiera (https://ingreso-impuesto-compass.lovable.app) con mi app de reparaciones Game Fix Pro / Console Care Connect (https://gamefixpro.lovable.app). Revisé tu código: MovementsContext usa public.movements con user_id, type, amount, category, description, method, note, source y created_at. MovementType es income/expense, MovementSource personal/business y métodos cash/card/transfer/other. No existe receptor de pagos actualmente. No cambies ni reemplaces bases de datos ni borres registros.

## Lo que ya está preparado en Game Fix Pro

- Tabla public.repair_payments: id UUID del pago, user_id (cuenta que registró el pago), repair_id, client_name, equipment y client_phone congelados al confirmar pagos nuevos, amount positivo, paid_on DATE, method, sync_status pending/synced, sync_error, remote_movement_id y synced_at. No se crean pagos desde presupuestos ni se exportan órdenes antiguas. Cada abono tiene su propio UUID. RLS permite leer solamente los pagos propios; escritura mediante RPC validada record_repair_payment. Repetir un UUID con datos distintos se rechaza, no sobrescribe el pago.
- Formulario de registro/edición permite confirmar pago recibido, fecha y método. Guardar nuevamente sin un nuevo abono no registra otro pago. Un UUID se conserva durante el reintento tras un error de guardado. Las fotos no forman parte del envío. Los pagos nuevos incluyen client_phone; los anteriores y de prueba conservan el contrato sin teléfono. Consultar balans-board-phone-update.md para actualizar el receptor sin modificar recibos anteriores.
- Función desplegada sync-repair-payment: valida sesión de Game Fix Pro y propiedad del pago. Busca un vínculo activo en public.finance_account_links: user_id único de Game Fix Pro, binding_id UUID único, destination_user_id UUID de Balans Board y enabled. Esta tabla es privada, sin acceso del navegador. Actualmente NO hay vínculo ni credenciales configuradas.
- La función espera secretos exclusivamente del lado servidor: BALANS_PAYMENT_RECEIVER_URL (URL HTTPS completa del receptor) y BALANS_PAYMENT_SHARED_SECRET (secreto compartido). Solo permite POST a la URL configurada, sin redirecciones. Al faltar configuración conserva pending y permite reintentar. No hay cron ni envío masivo histórico.

## Implementa aquí, en Balans Board

1. Crea un receptor privado de pagos en una función y una pantalla/función autenticada para vincular explícitamente mi cuenta financiera con mi cuenta de Game Fix Pro. No uses correos o nombres de clientes para escoger el destino, ni aceptes user_id financiero enviado por el cliente como autorización. Guarda una tabla privada de bindings con binding_id, identidad de la cuenta de Game Fix Pro y user_id de Balans Board autenticado. El destino se deriva SOLO de ese binding activo. Diseña vinculación con código aleatorio de un solo uso, expiración y consumo atómico, autenticada en ambas apps; no habilites un vínculo a partir de UUIDs pegados sin comprobar ambas sesiones. Entrega el contrato de esa vinculación para implementarlo después en Game Fix Pro; el campo destination_user_id local debe corresponder al propietario verificado del binding remoto.
2. Despliega primero el receptor para tener su URL HTTPS real. Luego solicita BALANS_PAYMENT_SHARED_SECRET mediante formulario seguro con opción Generar/copiar y destino indicando que debe guardarse el MISMO valor en Game Fix Pro. Nunca generes/imprimas claves en chat ni las pongas en el navegador. El receptor valida X-Integration-Secret en servidor y binding activo antes de insertar. Este endpoint servidor-a-servidor no recibe JWT de Balans Board; debe validar el secreto compartido. Las funciones de vinculación SÍ exigen la sesión autenticada de cada app.
3. Acepta este JSON versionado exacto, validado con Zod, y rechaza datos no válidos:

```json
{
  "version": 1,
  "source_app": "gamefixpro",
  "binding_id": "UUID del vínculo verificado",
  "payment_id": "UUID estable del pago",
  "repair_id": "#031",
  "client_name": "Cliente de prueba",
  "client_phone": "+1 809 555 0100",
  "equipment": "Sony — PS5",
  "amount": 150,
  "paid_on": "2026-11-15",
  "method": "cash",
  "type": "income",
  "source": "business",
  "category": "Reparaciones",
  "description": "Pago de Cliente de prueba — Sony — PS5"
}
```

Cabeceras: Content-Type application/json, X-Integration-Secret (privado) e Idempotency-Key = payment_id. Valida importe finito mayor que cero con máximo dos decimales, fecha real y métodos cash/card/transfer/other. Comprueba que ambas apps usan la misma moneda antes de habilitar el vínculo: ninguna hace conversión y la app actual no envía código de moneda.

4. Guarda en public.movements para el user_id del binding: type='income', source='business', category='Reparaciones', amount=importe realmente cobrado, method=método, description='Pago de [cliente] — [equipo]'. Usa la fecha de pago para created_at con una política explícita de zona horaria que conserve el día mostrado. Verifica que Dashboard, Movimientos, Negocio, Detallados y cálculos de impuestos existentes incluyan ese movimiento sin crear otro registro paralelo ni cambiar fórmulas.
5. Implementa deduplicación TRANSACCIONAL en Postgres (RPC interna solo service_role): restricción única por source_app + payment_id (y comprobación de binding), creación de movement y recibo de integración en una sola transacción. Reintentos concurrentes devuelven el MISMO movement_id; no dependas de select-antes-de-insert. Conserva una copia del payload original o hash para rechazar 409 si el mismo UUID vuelve con otro importe, nombre, fecha, método, equipo o binding. No actualices ingresos silenciosamente; rechaza cambios de payload. El mismo abono no puede reasignarse a otro binding.
6. Devuelve 200 SOLAMENTE después del commit y lectura del ingreso persistido, con JSON:

```json
{"status":"confirmed","payment_id":"UUID recibido","binding_id":"UUID recibido","movement_id":"UUID del único ingreso"}
```

Un reintento legítimo devuelve exactamente ese mismo recibo; no crees otro movimiento. Game Fix Pro solo marca synced cuando status, payment_id y binding_id coinciden y movement_id es UUID. Errores deben devolver estado no 2xx y un mensaje seguro, sin secretos ni datos innecesarios.
7. Nuevas tablas públicas requieren GRANT, RLS y políticas: recibos privados y bindings solo servidor; movimientos mantienen acceso por propietario. No expongas credenciales ni permitas destinos suministrados por el navegador. Acepta client_phone opcional de pagos nuevos (string, máximo 20 caracteres), consérvalo en el recibo y muéstralo en detalles. No envíes imágenes, emails ni historial técnico.

## Qué falta después en Game Fix Pro

- Configurar la URL real y el secreto compartido mediante formulario seguro (aún no se solicitaron porque no existe receptor).
- Implementar la finalización autenticada del código de vinculación definido arriba y registrar el vínculo verificado en finance_account_links. No hay botón de vinculación actualmente; no actives una fila manual sin acreditar ambas identidades.
- Mantener sincronización desactivada hasta resolver URL, credenciales, binding y moneda.

## Prueba obligatoria

Con sesión real en ambas apps y vínculo verificado, registrar un pago de prueba explícitamente autorizado de 150 con nombre 'Cliente de prueba', fecha y método. Leerlo en Movimientos y en las vistas financieras. Reintentar envío con el mismo payment_id y comprobar mediante lectura que hay UN SOLO ingreso con el mismo movement_id y el nombre correcto. Probar también fallo/reintento, importe cero, payload modificado (409), acceso a pago ajeno y nuevo abono con otro UUID. No declares terminada la conexión hasta leer el ingreso en Balans Board; la prueba de extremo a extremo sigue pendiente y no se han creado ingresos ni pagos de prueba reales en ninguna app.