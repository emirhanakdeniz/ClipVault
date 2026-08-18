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

pub fn ensure_column(
    conn: &Connection,
    table: &str,
    column: &str,
    col_def: &str,
) -> Result<(), String> {
    let pragma_sql = format!(
        "SELECT COUNT(*) FROM pragma_table_info('{}') WHERE name = ?1",
        table
    );
    let exists: bool = conn
        .query_row(&pragma_sql, [column], |row| row.get::<_, i64>(0))
        .map_err(|e| e.to_string())?
        > 0;
    if !exists {
        let alter_sql = format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, col_def);
        conn.execute(&alter_sql, []).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn setup_schema(conn: &Connection) -> Result<(), String> {
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

    // Schema migrations for existing databases
    ensure_column(conn, "snippets", "pinned", "INTEGER NOT NULL DEFAULT 0")?;
    ensure_column(conn, "snippets", "archived", "INTEGER NOT NULL DEFAULT 0")?;
    ensure_column(conn, "snippets", "tags", "TEXT NOT NULL DEFAULT '[]'")?;
    ensure_column(conn, "snippets", "source", "TEXT NOT NULL DEFAULT 'manual'")?;
    ensure_column(conn, "snippets", "sensitive", "INTEGER NOT NULL DEFAULT 0")?;
    ensure_column(conn, "snippets", "copy_count", "INTEGER NOT NULL DEFAULT 0")?;

    // Generic key/value settings store (e.g. global shortcut preferences)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Performance indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON snippets(created_at DESC)",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_snippets_clipboard_prune
         ON snippets(source, favorite, pinned, created_at ASC, id ASC)",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_snippets_sensitive ON snippets(sensitive)",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_snippets_copy_count ON snippets(copy_count DESC)",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn init(app: &tauri::AppHandle) -> Result<Db, String> {
    let dir: PathBuf = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let conn = Connection::open(dir.join("clipvault.db")).map_err(|e| e.to_string())?;
    setup_schema(&conn)?;
    Ok(Db(Mutex::new(conn)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_setup_schema_and_ensure_column() {
        let conn = Connection::open_in_memory().unwrap();
        setup_schema(&conn).unwrap();

        // Check tables exist
        let snippets_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='snippets'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(snippets_count, 1);

        let settings_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='settings'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(settings_count, 1);

        // Check columns exist
        let sensitive_exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('snippets') WHERE name='sensitive'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(sensitive_exists, 1);

        let copy_count_exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('snippets') WHERE name='copy_count'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(copy_count_exists, 1);

        // Running ensure_column again should be an idempotent no-op
        assert!(ensure_column(&conn, "snippets", "sensitive", "INTEGER NOT NULL DEFAULT 0").is_ok());
        assert!(ensure_column(&conn, "snippets", "copy_count", "INTEGER NOT NULL DEFAULT 0").is_ok());
    }
}
