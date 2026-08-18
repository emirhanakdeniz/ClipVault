use rusqlite::Connection;
use std::{
    path::PathBuf,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::Manager;

pub struct Db(pub Mutex<Connection>);

pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock before UNIX epoch")
        .as_millis() as i64
}

pub fn init(app: &tauri::AppHandle) -> Result<Db, String> {
    let dir: PathBuf = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let conn = Connection::open(dir.join("clipvault.db")).map_err(|e| e.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS snippets (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'text',
            favorite INTEGER NOT NULL DEFAULT 0,
            pinned INTEGER NOT NULL DEFAULT 0,
            archived INTEGER NOT NULL DEFAULT 0,
            tags TEXT NOT NULL DEFAULT '[]',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;
    // Migration for databases created before the pinned column existed.
    // CREATE TABLE IF NOT EXISTS does not evolve an existing schema, so add the
    // column explicitly and tolerate the "duplicate column name" error.
    let has_pinned = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('snippets') WHERE name = 'pinned'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())?
        > 0;
    if !has_pinned {
        conn.execute(
            "ALTER TABLE snippets ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    // Same migration pattern for the archived column.
    let has_archived = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('snippets') WHERE name = 'archived'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())?
        > 0;
    if !has_archived {
        conn.execute(
            "ALTER TABLE snippets ADD COLUMN archived INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    // Same migration pattern for the tags column (stored as a JSON array).
    let has_tags = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('snippets') WHERE name = 'tags'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())?
        > 0;
    if !has_tags {
        conn.execute(
            "ALTER TABLE snippets ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(Db(Mutex::new(conn)))
}
