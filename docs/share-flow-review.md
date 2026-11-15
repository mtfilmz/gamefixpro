# Revisión de Compartir

Regla: Compartir ofrece envío y nunca sustituye esa acción por una descarga automática.

| Lugar | Código revisado | Resultado |
| --- | --- | --- |
| Dashboard e Historial, computadora | `RepairTable`, `Index`, `QRTicketModal` | Cumple; QR abre el comprobante compartido. Verificado con sesión real. |
| Dashboard, Historial y Buscar, teléfono | `MobileRepairCard`, `BottomNav`, `Index`, `QRTicketModal` | Cumple; los tres accesos ofrecen canales sin descargar. Verificados con sesión real. |
| Buscar, computadora | `Index`, `RepairTable` | Cumple; reutiliza exactamente el mismo comprobante que Dashboard e Historial. |
| Actualizar Estado | `UpdateStatus`, `Index` | Cumple; Compartir abre el mismo comprobante. Verificado sin guardar cambios. |
| Recepción de un registro nuevo | `Index.handleSave`, `QRTicketModal` | Cumple por reutilización del comprobante; no se creó un registro real para probar. |
| Compartir imagen, texto y canales | `QRTicketModal`, `shareReceipt` | Cumple; archivo nativo si se admite, texto nativo o canales si no. Cancelar no descarga; errores ofrecen canales. |
| SMS, WhatsApp, correo y copiar | `QRTicketModal`, `smsLink`, `repairMessage` | Cumple; abren envío o copian texto. No adjuntan automáticamente imágenes en el modo de canales. |
| Descargar factura e imprimir | `QRTicketModal` | Acciones separadas y explícitas; Compartir no llama a Descargar. |
| Seguimiento público | `TrackRepair`, `public-repair-status` | No tiene acción Compartir ni descarga automática; consulta el estado y fotos. |
| Configuración / Google Drive | `ConfigPanel`, `GoogleDriveConnectButton`, migración de respaldos | No hay acción Compartir registros ni tarea de respaldo implementada que descargue el comprobante. Sin cambios en ajustes. |
| Notificaciones locales | `notifications` | Solo muestra notificaciones; no comparte ni descarga. |
| Pagos y funciones del servidor | `payment-service`, funciones y búsquedas en migraciones | Envío financiero independiente, sin navegador ni descarga de comprobantes. No se modificó. |

Se comprobaron seis entradas de registros existentes con sesión real, nueve pruebas de reglas y las solicitudes nativas de imagen/texto mediante sustitutos del navegador. No se enviaron mensajes externos, no se crearon registros y no se alteraron pagos, permisos, configuración ni ejemplos.