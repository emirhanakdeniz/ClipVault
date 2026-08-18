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
    pub archived: bool,
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
        archived: row.get::<_, i64>(8)? != 0,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn fetch_snippet(conn: &Connection, id: &str) -> Result<Snippet, String> {
    conn.query_row(
        "SELECT id, title, content, type, favorite, created_at, updated_at, pinned, archived
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
            "SELECT id, title, content, type, favorite, created_at, updated_at, pinned, archived
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
        archived: false,
        created_at: now,
        updated_at: now,
    };
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO snippets (id, title, content, type, favorite, pinned, archived, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            snippet.id,
            snippet.title,
            snippet.content,
            snippet.snippet_type,
            snippet.favorite as i64,
            snippet.pinned as i64,
            snippet.archived as i64,
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
pub fn set_archived(db: State<'_, Db>, id: String, archived: bool) -> Result<Snippet, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let changed = conn
        .execute(
            "UPDATE snippets SET archived = ?1, updated_at = ?2 WHERE id = ?3",
            params![archived as i64, now_ms(), id],
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

// ---------------------------------------------------------------------------
// Import / export
// ---------------------------------------------------------------------------

/// Single entry inside an export file. Tags are exported as an empty list for
/// forward compatibility until tagging exists in the data model.
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ExportEntry {
    id: String,
    title: String,
    content: String,
    #[serde(rename = "type")]
    snippet_type: String,
    favorite: bool,
    pinned: bool,
    archived: bool,
    tags: Vec<String>,
    created_at: i64,
    updated_at: i64,
}

/// Versioned export envelope so future format changes stay detectable.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ExportFile {
    format: &'static str,
    version: u32,
    exported_at: i64,
    snippets: Vec<ExportEntry>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct ImportEntry {
    id: Option<String>,
    title: Option<String>,
    content: Option<String>,
    #[serde(rename = "type")]
    snippet_type: Option<String>,
    favorite: Option<bool>,
    pinned: Option<bool>,
    archived: Option<bool>,
    created_at: Option<i64>,
    updated_at: Option<i64>,
}

#[derive(Deserialize)]
struct ImportFile {
    snippets: Option<Vec<ImportEntry>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub imported: usize,
    pub skipped: usize,
}

#[tauri::command]
pub fn export_snippets(db: State<'_, Db>, path: String) -> Result<usize, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, content, type, favorite, created_at, updated_at, pinned, archived
             FROM snippets ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_snippet)
        .map_err(|e| e.to_string())?;
    let snippets: Vec<Snippet> = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let file = ExportFile {
        format: "clipvault-export",
        version: 1,
        exported_at: now_ms(),
        snippets: snippets
            .into_iter()
            .map(|s| ExportEntry {
                id: s.id,
                title: s.title,
                content: s.content,
                snippet_type: s.snippet_type,
                favorite: s.favorite,
                pinned: s.pinned,
                archived: s.archived,
                tags: Vec::new(),
                created_at: s.created_at,
                updated_at: s.updated_at,
            })
            .collect(),
    };
    let count = file.snippets.len();
    let json = serde_json::to_string_pretty(&file).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(count)
}

/// Normalization matching the frontend duplicate check: trim and collapse all
/// whitespace runs to a single space.
fn normalize_content(content: &str) -> String {
    content.split_whitespace().collect::<Vec<_>>().join(" ")
}

#[tauri::command]
pub fn import_snippets(db: State<'_, Db>, path: String) -> Result<ImportResult, String> {
    let raw = std::fs::read_to_string(&path)
        .map_err(|e| format!("cannot read file: {e}"))?;
    let file: ImportFile =
        serde_json::from_str(&raw).map_err(|e| format!("not a valid JSON file: {e}"))?;

    let entries = match file.snippets {
        Some(entries) if !entries.is_empty() => entries,
        _ => return Err("file contains no snippets".to_string()),
    };

    // 1. Validate every entry before touching the database. A single
    //    malformed entry rejects the whole import, so existing data can
    //    never be partially corrupted.
    struct ValidEntry {
        id: String,
        title: String,
        content: String,
        snippet_type: String,
        favorite: bool,
        pinned: bool,
        archived: bool,
        created_at: i64,
        updated_at: i64,
    }

    let mut valid = Vec::with_capacity(entries.len());
    for (index, entry) in entries.iter().enumerate() {
        let number = index + 1;
        let title = entry
            .title
            .clone()
            .ok_or(format!("snippet {number}: missing title"))?;
        if title.trim().is_empty() {
            return Err(format!("snippet {number}: title is empty"));
        }
        let content = entry
            .content
            .clone()
            .ok_or(format!("snippet {number}: missing content"))?;
        if content.trim().is_empty() {
            return Err(format!("snippet {number}: content is empty"));
        }
        let snippet_type = match entry.snippet_type.as_deref() {
            Some("code") | Some("text") | Some("link") => entry.snippet_type.clone().unwrap(),
            Some(other) => {
                return Err(format!("snippet {number}: unknown type \"{other}\""));
            }
            None => "text".to_string(),
        };
        for (field, value) in [("createdAt", entry.created_at), ("updatedAt", entry.updated_at)] {
            if let Some(v) = value {
                if v <= 0 {
                    return Err(format!("snippet {number}: {field} must be positive"));
                }
            }
        }
        let now = now_ms();
        let id = match entry.id.as_deref() {
            Some(id) if !id.trim().is_empty() => id.to_string(),
            _ => Uuid::new_v4().to_string(),
        };
        valid.push(ValidEntry {
            id,
            title,
            content,
            snippet_type,
            favorite: entry.favorite.unwrap_or(false),
            pinned: entry.pinned.unwrap_or(false),
            archived: entry.archived.unwrap_or(false),
            created_at: entry.created_at.unwrap_or(now),
            updated_at: entry.updated_at.unwrap_or(now),
        });
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // 2. Collect what is already stored so duplicates are skipped instead of
    //    re-imported (no overwrites, no merges).
    let mut stmt = conn
        .prepare("SELECT id, content FROM snippets")
        .map_err(|e| e.to_string())?;
    let existing: Vec<(String, String)> = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    let mut seen_ids: std::collections::HashSet<String> =
        existing.iter().map(|(id, _)| id.clone()).collect();
    let mut seen_contents: std::collections::HashSet<String> = existing
        .iter()
        .map(|(_, content)| normalize_content(content))
        .collect();

    // 3. Single transaction: either every insert lands or nothing changes.
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    let mut imported = 0usize;
    let mut skipped = 0usize;
    for entry in valid {
        let normalized = normalize_content(&entry.content);
        if seen_ids.contains(&entry.id) || seen_contents.contains(&normalized) {
            skipped += 1;
            continue;
        }
        tx.execute(
            "INSERT INTO snippets (id, title, content, type, favorite, pinned, archived, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                entry.id,
                entry.title,
                entry.content,
                entry.snippet_type,
                entry.favorite as i64,
                entry.pinned as i64,
                entry.archived as i64,
                entry.created_at,
                entry.updated_at
            ],
        )
        .map_err(|e| e.to_string())?;
        seen_ids.insert(entry.id);
        seen_contents.insert(normalized);
        imported += 1;
    }
    tx.commit().map_err(|e| e.to_string())?;

    Ok(ImportResult { imported, skipped })
}
