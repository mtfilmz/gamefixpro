const COMMANDS: &[&str] = &["share_file", "share_whatsapp", "share_sms", "whatsapp_apps"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
