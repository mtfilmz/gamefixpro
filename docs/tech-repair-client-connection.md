# Conectar clientes desde Tech Repair

Estado: consulta y recepción de clientes preparadas en Super Mobile Game Fix; vinculación y sincronización en Tech Repair pendientes. No se ha vinculado ninguna cuenta ni copiado clientes. Pagos y Balance Board permanecen independientes.

## Prompt para pegar en Tech Repair

Implementa una conexión de consulta y sincronización de clientes desde Super Mobile Game Fix, sin reemplazar clientes actuales ni modificar pagos o Balance Board. La cuenta destino autorizada es supermobilepr@gmail.com, pero no basta con conocer el correo: valida la sesión del propietario y su correo verificado en servidor antes del canje. Usa workspace_owner y los permisos existentes de workspace_members. Solo el propietario vincula; un empleado activo solo consulta/sincroniza si posee permiso read de Clientes. Ningún empleado puede seleccionar un owner_id arbitrario. No uses service_role para saltar permisos al guardar contactos.

Solicita TECH_REPAIR_CLIENT_SHARED_SECRET mediante formulario seguro con Generar/copiar, destino: formulario del mismo secreto en Super Mobile Game Fix. Usa el mismo valor una sola vez en ambos formularios. Nunca lo muestres en chat, navegador, registros ni archivos. No uses BALANS_PAYMENT_SHARED_SECRET. La conexión está deshabilitada hasta configurar este secreto en ambas apps.

Configura TECH_REPAIR_CLIENT_SOURCE_URL privadamente: URL HTTPS completa de la función tech-repair-clients de Super Mobile Game Fix. Consulta una instantánea de ese proyecto (d5fd06a7-08ea-4153-a340-9d298c566b03), lee su configuración pública del cliente y deriva en servidor la dirección completa /functions/v1/tech-repair-clients; no la muestres en chat ni construyas rutas relativas /api. No uses las credenciales de la instantánea para leer registros: únicamente llama al endpoint dedicado una vez configurada la clave compartida y realizado el canje. Todas las llamadas son POST servidor-a-servidor, Content-Type application/json y X-Client-Integration-Secret con el secreto. No sigas redirecciones ni permitas URL suministrada por el navegador.

### Canje

El propietario inicia sesión en ambas apps. En Game Fix → Configuración → Clientes · Tech Repair genera un código de 64 caracteres hexadecimales, de un solo uso y duración de diez minutos. Tech Repair envía:

```json
{"action":"redeem","code":"CODIGO_DE_UN_SOLO_USO","target_user_id":"UUID_DE_LA_SESION_VERIFICADA","target_email":"CORREO_VERIFICADO_DE_LA_SESION"}
```

Nunca aceptes target_user_id o target_email del navegador como autorización: derívalos de la sesión verificada del propietario. Guarda privadamente el recibo solo si status=linked, binding_id es UUID, target_user_id coincide y scope=clients:read. Guarda vínculo por owner; no lo expongas a empleados ni al navegador. No repitas canjes tras fallos de red inciertos. Consulta estado en Game Fix antes de generar otro código.

### Consulta paginada

```json
{"action":"list","binding_id":"UUID_DEL_RECIBO","target_user_id":"UUID_PROPIETARIO_VERIFICADO","kind":"clients","limit":100}
```

La respuesta contiene version=1, binding_id, kind, clients y next. Repite con after=next hasta next=null. Recorre también kind=repairs (cursor independiente) para contactos que solo tienen reparación. Nunca uses un cursor clients en repairs. Campos: source_id estable (clients:UUID o repairs:ID), source_key de corrección cuando existe, name, phone, contact, email, address, notes. Las reparaciones solo aportan nombre/teléfono/correo: no comparten notas técnicas, equipo, fotos, costos ni pagos. Solo se exportan registros propiedad del usuario que concedió acceso, no reparaciones ajenas visibles por rol.

Prioriza contactos guardados sobre reparaciones usando source_key y la misma clave normalizada de Game Fix: JSON de [nombre sin acentos en minúscula y espacios extremos, teléfono solo dígitos o correo en minúsculas]. Deduplica después por esa clave; no unas personas solo por nombre. Conserva source_id en un mapa privado por binding; repetir sincronización actualiza la referencia, no inserta otro cliente. No sobrescribas silenciosamente correcciones locales: muestra conflicto y permite conservar lo local. Guarda los seis campos en contactos del taller con permisos existentes; no edites facturas, reparaciones ni instantáneas de pagos. No borres clientes si una página falla o si un contacto desaparece del origen. Para escritura hacia Game Fix sigue la ampliación versión 2 y su consentimiento independiente.

Verifica permisos en servidor en cada consulta y lectura local; no basta ocultar botones. Cache/offline debe quedar aislado por usuario, invalidarse al revocar membresía y no conservar datos para empleados sin permiso. Al recibir 403 marca conexión revocada y detén la sincronización. La desconexión en Game Fix revoca consultas futuras pero no borra copias ya importadas; acláralo al propietario.

Prueba con sesiones reales: propietario enlazado, empleado activo con permiso Clientes, empleado sin permiso, usuario ajeno, código vencido/reutilizado, vínculo revocado y dos sincronizaciones que mantienen el mismo número de contactos. Conserva todos los clientes existentes y no crees pagos de prueba. No declares conexión completa hasta leer en Tech Repair los contactos importados con esos permisos.

## Pasos del propietario

1. Completar el prompt anterior en Tech Repair.
2. Guardar la misma clave dedicada a clientes en los formularios seguros de ambas apps, sin publicarla en chat.
3. Entrar con supermobilepr@gmail.com en Tech Repair y con la cuenta propietaria de los clientes en Game Fix.
4. Generar el código en Game Fix y pegarlo en Ajustes de Tech Repair.
   Después de vincular, activar **Recibir clientes de Tech Repair** en Game Fix → Configuración → Clientes · Tech Repair.
5. Sincronizar clientes y asignar permiso Clientes únicamente a los empleados autorizados.

Los campos nuevos contacto/dirección/notas están vacíos para registros antiguos hasta que se completen; no se inventan ni se extraen de detalles técnicos.

## Ampliación bidireccional · versión 2

Tech Repair coordina ambas direcciones mediante el mismo endpoint dedicado, sin dar a Game Fix acceso directo a su base de datos. Primero consulta/importa las páginas de Game Fix, luego envía los clientes propios de Tech Repair con `action=receive`. Conserva vínculo y clientes actuales; nunca toca Balance Board ni pagos. El propietario habilita la recepción en Game Fix; un vínculo de solo lectura no autoriza importaciones.

```json
{"action":"receive","binding_id":"UUID_DEL_RECIBO","target_user_id":"UUID_PROPIETARIO_VERIFICADO","clients":[{"source_id":"tech-clients:UUID_ESTABLE","origin_gamefix_id":null,"name":"Nombre","phone":"","email":"","contact":"","address":"","notes":""}]}
```

Máximo 25 clientes por página y 200000 caracteres por solicitud; enviar los seis campos siempre. Nunca derivar notas de detalles técnicos. `origin_gamefix_id` solo es el UUID de un cliente guardado recibido originalmente como `clients:UUID` de Game Fix; no usar IDs de reparaciones. Mantenerlo en el mapa privado evita rebotes/duplicados cuando el contacto cambia. Los contactos importados de reparaciones deben conservar su origen y no reenviarse como clientes nuevos. La identidad `source_id` de Tech Repair no cambia al editar nombre/teléfono ni entre reintentos.

Respuesta: `version=2`, `binding_id`, `results` con `source_id`, `client_id` y `status` (`created`, `unchanged`, `conflict`). Validar todos los IDs y la cobertura de la página; conservar cada `client_id` como `origin_gamefix_id` para próximas consultas/envíos. Un 409 puede indicar página parcialmente recibida: reintentar la página con los mismos IDs es seguro; no contarla como completa. Un 403 detiene la conexión, sin borrar clientes.

Game Fix conserva el cliente existente cuando recibe valores diferentes y presenta ambos juegos de los seis campos en Clientes. Solo el propietario elige **Conservar Game Fix** o **Aceptar Tech Repair**; si cambió el cliente mientras decidía, debe actualizar antes de resolver. Repetir los mismos datos no recrea clientes ni vuelve a abrir un conflicto resuelto. No hay borrados remotos ni mezcla por nombre solamente. Tech Repair debe aplicar el mismo criterio conservador y ofrecer resolución local de conflictos, sin reenviar automáticamente contactos con conflictos pendientes.

En Tech Repair valida en servidor, en cada intercambio, propietario autenticado `supermobilepr@gmail.com` y permisos activos de empleados: `read` de Clientes para consulta; permiso existente de crear/editar Clientes para sincronización con escritura, tanto local como remota. Deriva siempre `target_user_id` del propietario verificado, nunca de un parámetro del navegador. La clave dedicada ya configurada no debe mostrarse ni copiarse a chat o archivos; mantenerla solo en formularios seguros y servidor. No usar claves financieras.

Verifica dos sincronizaciones consecutivas con igual número de contactos, cambios de teléfono sin duplicados, cambios simultáneos conservados con conflicto, resolución local/remota, origen de reparación sin eco, páginas parcialmente fallidas, usuario ajeno, empleado sin permisos y vínculo revocado. No declares completa la conexión hasta leer los clientes en ambas apps con sesiones reales.