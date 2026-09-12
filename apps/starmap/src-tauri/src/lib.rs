use std::fs;
use std::path::PathBuf;

fn starmap_workspace_path() -> Result<PathBuf, String> {
    let executable = std::env::current_exe()
        .map_err(|error| error.to_string())?;

    let directory = executable
        .parent()
        .ok_or_else(|| "Could not determine executable directory".to_string())?;

    Ok(directory.join("starmap.json"))
}

#[tauri::command]
fn load_starmap_workspace() -> Result<Option<String>, String> {
    let path = starmap_workspace_path()?;

    if !path.exists() {
        return Ok(None);
    }

    fs::read_to_string(path)
        .map(Some)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn save_starmap_workspace(content: String) -> Result<(), String> {
    let path = starmap_workspace_path()?;

    fs::write(path, content)
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            load_starmap_workspace,
            save_starmap_workspace
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
