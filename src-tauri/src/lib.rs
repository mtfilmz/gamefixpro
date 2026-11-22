//! Programa de Windows y Android de Super Mobile Game Fix.
//!
//! Es la misma app web de Lovable (carpeta `src/`), empaquetada con Tauri. Aquí solo va lo que
//! necesita un programa instalado y que la web no hace:
//! - abrir fuera del programa WhatsApp, mensajes de texto, correo, teléfono y páginas externas;
//! - compartir la imagen del recibo con el menú Compartir de Android y guardarla con su ventana de guardar;
//! - en Windows, guardar la imagen del recibo en Documentos\Game Fix\Recibos;
//! - avisar cuando hay una versión nueva (Windows se actualiza solo con firma; Android baja el APK).
//! Los datos siguen en la misma base de datos de Game Fix (Supabase), igual que la web.

use base64::Engine;
use std::fs;
use std::time::Duration;
use tauri::Manager;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use tauri_plugin_opener::OpenerExt;

/// Código que corre dentro de la ventana antes que la app (ver nativo.js).
const NATIVO_JS: &str = include_str!("nativo.js");

fn limpiar_nombre(s: &str) -> String {
    s.chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_' || *c == '.')
        .take(120)
        .collect()
}

fn decodificar(b64: &str) -> Result<Vec<u8>, String> {
    if b64.len() > 40_000_000 {
        return Err("El archivo es demasiado grande.".into());
    }
    base64::engine::general_purpose::STANDARD
        .decode(b64.as_bytes())
        .map_err(|_| "El archivo no es válido.".to_string())
}

/// Guarda un archivo (la imagen de un recibo) en Documentos\Game Fix\<carpeta>\<nombre>
/// y devuelve la ruta completa para mostrarla.
#[tauri::command]
fn guardar_binario(
    app: tauri::AppHandle,
    carpeta: String,
    nombre: String,
    contenido_b64: String,
) -> Result<String, String> {
    let carpeta = limpiar_nombre(&carpeta);
    let nombre = limpiar_nombre(&nombre);
    if carpeta.is_empty() || nombre.is_empty() || nombre.starts_with('.') {
        return Err("Nombre de archivo no válido.".into());
    }
    let datos = decodificar(&contenido_b64)?;
    #[cfg(target_os = "android")]
    let base = app.path().app_data_dir().map_err(|e| e.to_string())?;
    #[cfg(not(target_os = "android"))]
    let base = app.path().document_dir().map_err(|e| e.to_string())?;
    let dir = base.join("Game Fix").join(carpeta);
    fs::create_dir_all(&dir).map_err(|e| format!("No se pudo crear la carpeta: {e}"))?;
    let ruta = dir.join(nombre);
    fs::write(&ruta, datos).map_err(|e| format!("No se pudo guardar el archivo: {e}"))?;
    Ok(ruta.to_string_lossy().to_string())
}

/// Guarda un archivo en la carpeta temporal de la app (para compartirlo) y devuelve su ruta.
/// Borra los archivos que quedaron de veces anteriores.
#[tauri::command]
fn archivo_temporal(
    app: tauri::AppHandle,
    nombre: String,
    contenido_b64: String,
) -> Result<String, String> {
    let nombre = limpiar_nombre(&nombre);
    if nombre.is_empty() || nombre.starts_with('.') {
        return Err("Nombre de archivo no válido.".into());
    }
    let datos = decodificar(&contenido_b64)?;
    let dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| e.to_string())?
        .join("compartir");
    fs::create_dir_all(&dir).map_err(|e| format!("No se pudo crear la carpeta temporal: {e}"))?;
    if let Ok(entradas) = fs::read_dir(&dir) {
        for e in entradas.flatten() {
            let _ = fs::remove_file(e.path());
        }
    }
    let ruta = dir.join(nombre);
    fs::write(&ruta, datos).map_err(|e| format!("No se pudo preparar el archivo: {e}"))?;
    Ok(ruta.to_string_lossy().to_string())
}

/// Direcciones que se quedan dentro del programa: la propia app y lo que el navegador usa por dentro.
/// Todo lo demás (WhatsApp, sms:, mailto:, tel:, páginas web) se abre fuera.
fn es_interna(url: &tauri::Url) -> bool {
    match url.scheme() {
        "tauri" | "about" | "data" | "blob" | "asset" => true,
        "http" | "https" => matches!(
            url.host_str(),
            Some("tauri.localhost") | Some("asset.localhost") | Some("ipc.localhost") | Some("localhost")
        ),
        _ => false,
    }
}

/// Mini-plugin: mete nativo.js en la ventana y saca afuera cualquier navegación externa.
fn nativo<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("nativo")
        .js_init_script(NATIVO_JS.to_string())
        .on_navigation(|webview, url| {
            if es_interna(url) {
                return true;
            }
            let _ = webview
                .app_handle()
                .opener()
                .open_url(url.as_str(), None::<&str>);
            false
        })
        .build()
}

/// "1.0.12" > "1.0.9"
fn es_mas_nueva(nueva: &str, actual: &str) -> bool {
    let partes = |v: &str| -> Vec<u64> {
        v.trim()
            .trim_start_matches('v')
            .split(|c: char| c == '.' || c == '-')
            .map(|p| p.parse::<u64>().unwrap_or(0))
            .collect()
    };
    let (a, b) = (partes(nueva), partes(actual));
    for i in 0..a.len().max(b.len()) {
        let (x, y) = (*a.get(i).unwrap_or(&0), *b.get(i).unwrap_or(&0));
        if x != y {
            return x > y;
        }
    }
    false
}

/// Windows: busca la versión nueva firmada en GitHub Releases y pide autorización antes de instalar.
#[cfg(desktop)]
async fn buscar_actualizacion(app: tauri::AppHandle) {
    use tauri_plugin_updater::UpdaterExt;
    tokio::time::sleep(Duration::from_secs(8)).await;
    let Ok(updater) = app.updater() else { return };
    let Ok(Some(update)) = updater.check().await else { return };
    let texto = format!(
        "Hay una versión nueva de Game Fix: {}.\n\n{}\n\nEl programa se cierra un momento, se actualiza y se abre solo.",
        update.version,
        update.body.clone().unwrap_or_default().trim()
    );
    let app2 = app.clone();
    app.dialog()
        .message(texto)
        .title("Actualización de Game Fix")
        .buttons(MessageDialogButtons::OkCancelCustom(
            "Instalar ahora".into(),
            "Más tarde".into(),
        ))
        .show(move |si| {
            if !si {
                return;
            }
            tauri::async_runtime::spawn(async move {
                match update.download_and_install(|_, _| {}, || {}).await {
                    Ok(()) => app2.restart(),
                    Err(e) => {
                        app2.dialog()
                            .message(format!("No se pudo instalar la actualización: {e}"))
                            .title("Actualización de Game Fix")
                            .show(|_| {});
                    }
                }
            });
        });
}

/// Android: lee android.json del último Release y, si hay versión nueva, ofrece bajar el APK.
#[cfg(target_os = "android")]
async fn buscar_actualizacion(app: tauri::AppHandle) {
    const INFO: &str = "https://github.com/mtfilmz/gamefixpro/releases/latest/download/android.json";
    const DESCARGAS: &str = "https://github.com/mtfilmz/gamefixpro/releases/download/";
    tokio::time::sleep(Duration::from_secs(8)).await;
    let Ok(cli) = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(5))
        .timeout(Duration::from_secs(20))
        .build()
    else {
        return;
    };
    let Ok(r) = cli.get(INFO).header("User-Agent", "GameFix").send().await else { return };
    if !r.status().is_success() {
        return;
    }
    let Ok(texto) = r.text().await else { return };
    let Ok(info) = serde_json::from_str::<serde_json::Value>(&texto) else { return };
    let version = info["version"].as_str().unwrap_or("").to_string();
    let url = info["url"].as_str().unwrap_or("").to_string();
    let notas = info["notes"].as_str().unwrap_or("").to_string();
    let actual = app.package_info().version.to_string();
    if version.is_empty() || !url.starts_with(DESCARGAS) || !es_mas_nueva(&version, &actual) {
        return;
    }
    let app2 = app.clone();
    app.dialog()
        .message(format!(
            "Hay una versión nueva de Game Fix: {version} (tienes la {actual}).\n\n{}\n\nToca Descargar, abre el archivo y toca Instalar. Tus datos no se pierden.",
            notas.trim()
        ))
        .title("Actualización de Game Fix")
        .buttons(MessageDialogButtons::OkCancelCustom(
            "Descargar".into(),
            "Más tarde".into(),
        ))
        .show(move |si| {
            if si {
                let _ = app2.opener().open_url(url, None::<&str>);
            }
        });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(nativo());
    #[cfg(target_os = "android")]
    let builder = builder.plugin(tauri_plugin_compartir::init());
    builder
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            #[cfg(any(desktop, target_os = "android"))]
            tauri::async_runtime::spawn(buscar_actualizacion(app.handle().clone()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![guardar_binario, archivo_temporal])
        .run(tauri::generate_context!())
        .expect("No se pudo abrir Game Fix");
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn versiones() {
        assert!(es_mas_nueva("1.0.12", "1.0.9"));
        assert!(es_mas_nueva("1.1.0", "1.0.99"));
        assert!(!es_mas_nueva("1.0.9", "1.0.9"));
        assert!(!es_mas_nueva("1.0.8", "1.0.9"));
        assert!(es_mas_nueva("v2.0.0", "1.9.9"));
    }

    #[test]
    fn internas() {
        let si = ["http://tauri.localhost/auth", "https://tauri.localhost/", "tauri://localhost/", "about:blank", "blob:http://tauri.localhost/x"];
        let no = ["https://wa.me/?text=hola", "sms:+17875550101?body=x", "mailto:a@b.com", "tel:7875550101", "https://gamefixpro.lovable.app", "whatsapp://send?phone=1"];
        for u in si {
            assert!(es_interna(&tauri::Url::parse(u).unwrap()), "{u}");
        }
        for u in no {
            assert!(!es_interna(&tauri::Url::parse(u).unwrap()), "{u}");
        }
    }
}
