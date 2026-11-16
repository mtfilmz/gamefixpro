# Conectar clientes desde Tech Repair

Estado: acceso de consulta preparado en Super Mobile Game Fix; vinculación y sincronización en Tech Repair pendientes. No se ha vinculado ninguna cuenta ni copiado clientes. Pagos y Balance Board permanecen independientes.

## Prompt para pegar en Tech Repair

Implementa una conexión de consulta y sincronización de clientes desde Super Mobile Game Fix, sin reemplazar clientes actuales ni modificar pagos o Balance Board. La cuenta destino autorizada es supermobilepr@gmail.com, pero no basta con conocer el correo: valida la sesión del propietario y su correo verificado en servidor antes del canje. Usa workspace_owner y los permisos existentes de workspace_members. Solo el propietario vincula; un empleado activo solo consulta/sincroniza si posee permiso read de Clientes. Ningún empleado puede seleccionar un owner_id arbitrario. No uses service_role para saltar permisos al guardar contactos.

Solicita TECH_REPAIR_CLIENT_SHARED_SECRET mediante formulario seguro con Generar/copiar, destino: formulario del mismo secreto en Super Mobile Game Fix. Usa el mismo valor una sola vez en ambos formularios. Nunca lo muestres en chat, navegador, registros ni archivos. No uses BALANS_PAYMENT_SHARED_SECRET. La conexión está deshabilitada hasta configurar este secreto en ambas apps.

Solicita TECH_REPAIR_CLIENT_SOURCE_URL como configuración privada: URL HTTPS completa de la función tech-repair-clients de Super Mobile Game Fix. Obtén esa dirección real desde el proyecto origen; no construyas rutas relativas /api. Todas las llamadas son POST servidor-a-servidor, Content-Type application/json y X-Client-Integration-Secret con el secreto. No sigas redirecciones ni permitas URL suministrada por el navegador.

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

Prioriza contactos guardados sobre reparaciones usando source_key y la misma clave normalizada de Game Fix: JSON de [nombre sin acentos en minúscula y espacios extremos, teléfono solo dígitos o correo en minúsculas]. Deduplica después por esa clave; no unas personas solo por nombre. Conserva source_id en un mapa privado por binding; repetir sincronización actualiza la referencia, no inserta otro cliente. No sobrescribas silenciosamente correcciones locales: muestra conflicto y permite conservar lo local. Guarda los seis campos en contactos del taller con permisos existentes; no edites facturas, reparaciones ni instantáneas de pagos. No borres clientes si una página falla o si un contacto desaparece del origen. Solo consulta desde Tech Repair hacia Game Fix, sin escritura remota.

Verifica permisos en servidor en cada consulta y lectura local; no basta ocultar botones. Cache/offline debe quedar aislado por usuario, invalidarse al revocar membresía y no conservar datos para empleados sin permiso. Al recibir 403 marca conexión revocada y detén la sincronización. La desconexión en Game Fix revoca consultas futuras pero no borra copias ya importadas; acláralo al propietario.

Prueba con sesiones reales: propietario enlazado, empleado activo con permiso Clientes, empleado sin permiso, usuario ajeno, código vencido/reutilizado, vínculo revocado y dos sincronizaciones que mantienen el mismo número de contactos. Conserva todos los clientes existentes y no crees pagos de prueba. No declares conexión completa hasta leer en Tech Repair los contactos importados con esos permisos.

## Pasos del propietario

1. Completar el prompt anterior en Tech Repair.
2. Guardar la misma clave dedicada a clientes en los formularios seguros de ambas apps, sin publicarla en chat.
3. Entrar con supermobilepr@gmail.com en Tech Repair y con la cuenta propietaria de los clientes en Game Fix.
4. Generar el código en Game Fix y pegarlo en Ajustes de Tech Repair.
5. Sincronizar clientes y asignar permiso Clientes únicamente a los empleados autorizados.

Los campos nuevos contacto/dirección/notas están vacíos para registros antiguos hasta que se completen; no se inventan ni se extraen de detalles técnicos.