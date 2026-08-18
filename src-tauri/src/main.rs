// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod crypto;
mod db;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let database = db::init(app.handle())?;
            app.manage(database);
            app.manage(crypto::VaultManager::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_snippets,
            commands::create_snippet,
            commands::update_snippet,
            commands::set_favorite,
            commands::set_pinned,
            commands::set_archived,
            commands::set_sensitive,
            commands::delete_snippet,
            commands::export_snippets,
            commands::import_snippets,
            commands::get_setting,
            commands::set_setting,
            commands::capture_clipboard,
            commands::prune_clipboard_history,
            commands::get_encryption_status,
            commands::setup_encryption,
            commands::unlock_vault,
            commands::lock_vault,
            commands::change_vault_passphrase,
            commands::disable_encryption,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
