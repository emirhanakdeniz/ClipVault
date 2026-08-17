use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

use crate::db::{now_ms, Db};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Snippet {
    pub id: String,
    pub title: String,
    pub content: String,
    #[serde(rename = "type")]
    pub snippet_type: String,
    pub favorite: bool,
    pub pinned: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

fn row_to_snippet(row: &rusqlite::Row) -> rusqlite::Result<Snippet> {
    Ok(Snippet {
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        snippet_type: row.get(3)?,
        favorite: row.get::<_, i64>(4)? != 0,
        pinned: row.get::<_, i64>(7)? != 0,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn fetch_snippet(conn: &Connection, id: &str) -> Result<Snippet, String> {
    conn.query_row(
        "SELECT id, title, content, type, favorite, created_at, updated_at, pinned
         FROM snippets WHERE id = ?1",
        params![id],
        row_to_snippet,
    )
    .map_err(|_| format!("snippet {id} not found"))
}

#[tauri::command]
pub fn list_snippets(db: State<'_, Db>) -> Result<Vec<Snippet>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, content, type, favorite, created_at, updated_at, pinned
             FROM snippets ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_snippet)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_snippet(
    db: State<'_, Db>,
    title: String,
    content: String,
    snippet_type: String,
) -> Result<Snippet, String> {
    let now = now_ms();
    let snippet = Snippet {
        id: Uuid::new_v4().to_string(),
        title,
        content,
        snippet_type,
        favorite: false,
        pinned: false,
        created_at: now,
        updated_at: now,
    };
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO snippets (id, title, content, type, favorite, pinned, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            snippet.id,
            snippet.title,
            snippet.content,
            snippet.snippet_type,
            snippet.favorite as i64,
            snippet.pinned as i64,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(snippet)
}

#[tauri::command]
pub fn update_snippet(
    db: State<'_, Db>,
    id: String,
    title: String,
    content: String,
) -> Result<Snippet, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let changed = conn
        .execute(
            "UPDATE snippets SET title = ?1, content = ?2, updated_at = ?3 WHERE id = ?4",
            params![title, content, now_ms(), id],
        )
        .map_err(|e| e.to_string())?;
    if changed == 0 {
        return Err(format!("snippet {id} not found"));
    }
    fetch_snippet(&conn, &id)
}

#[tauri::command]
pub fn set_favorite(db: State<'_, Db>, id: String, favorite: bool) -> Result<Snippet, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let changed = conn
        .execute(
            "UPDATE snippets SET favorite = ?1, updated_at = ?2 WHERE id = ?3",
            params![favorite as i64, now_ms(), id],
        )
        .map_err(|e| e.to_string())?;
    if changed == 0 {
        return Err(format!("snippet {id} not found"));
    }
    fetch_snippet(&conn, &id)
}

#[tauri::command]
pub fn set_pinned(db: State<'_, Db>, id: String, pinned: bool) -> Result<Snippet, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let changed = conn
        .execute(
            "UPDATE snippets SET pinned = ?1, updated_at = ?2 WHERE id = ?3",
            params![pinned as i64, now_ms(), id],
        )
        .map_err(|e| e.to_string())?;
    if changed == 0 {
        return Err(format!("snippet {id} not found"));
    }
    fetch_snippet(&conn, &id)
}

#[tauri::command]
pub fn delete_snippet(db: State<'_, Db>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let changed = conn
        .execute("DELETE FROM snippets WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    if changed == 0 {
        return Err(format!("snippet {id} not found"));
    }
    Ok(())
}
