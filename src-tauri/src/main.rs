// Evita que se abra una ventana de consola junto al programa en Windows.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    gamefix_lib::run()
}
