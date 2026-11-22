# Welcome to your Lovable project

TODO: Document your project here


## Programa de Windows y Android

La misma app se empaqueta como programa de Windows (`.exe`) y APK de Android con Tauri (carpeta `src-tauri/`).
No cambia nada de `src/`: usa la misma base de datos (Supabase) y las mismas funciones del servidor.

- **Se arma solo:** `.github/workflows/instaladores.yml` compila cada vez que cambia la app en `main` (también lo que se edita en Lovable; espera 5 minutos y compila solo el último cambio). También se lanza a mano en *Actions › Crear instaladores de Game Fix › Run workflow*.
- **Versión:** `1.0.<número de compilación>`. Cada compilación publica un Release `v1.0.N` con `GameFix_1.0.N_x64-setup.exe`, `GameFix_1.0.N_android.apk`, `latest.json` y `android.json`.
- **Actualizaciones:** el programa de Windows se actualiza con firma (`latest.json`); el de Android avisa y baja el APK nuevo (`android.json`). Para que esto funcione, el repo debe ser público.
- **Secretos necesarios** (Settings › Secrets and variables › Actions): `TAURI_SIGNING_PRIVATE_KEY` (firma de actualizaciones) y `ANDROID_KEYSTORE` (firma del APK). Son los mismos de Cobro.
- **`src-tauri/src/nativo.js`** corre dentro de la ventana antes que la app: apaga el service worker de la web, abre fuera del programa WhatsApp, `sms:`, `mailto:`, `tel:` y páginas externas, y en Android comparte/guarda la imagen del recibo con el menú del teléfono.
