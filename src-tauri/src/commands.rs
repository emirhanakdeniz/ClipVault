use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
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
    pub tags: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
    /// "manual" (created by the user) or "clipboard" (auto-captured).
    #[serde(default = "default_source")]
    pub source: String,
    /// Sensitive snippets have their content hidden in the UI and are excluded
    /// from clipboard duplicate matching.
    #[serde(default)]
    pub sensitive: bool,
}

fn default_source() -> String {
    "manual".to_string()
}

/// Decodes the tags column (a JSON array string) into a Vec<String>. A stored
/// value that fails to parse degrades to no tags rather than failing the read.
fn decode_tags(raw: String) -> Vec<String> {
    serde_json::from_str(&raw).unwrap_or_default()
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
        tags: decode_tags(row.get(9)?),
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
        source: row.get(10)?,
        sensitive: row.get::<_, i64>(11)? != 0,
    })
}

fn fetch_snippet(conn: &Connection, id: &str) -> Result<Snippet, String> {
    conn.query_row(
        "SELECT id, title, content, type, favorite, created_at, updated_at, pinned, archived, tags, source, sensitive
         FROM snippets WHERE id = ?1",
        params![id],
        row_to_snippet,
    )
    .map_err(|_| format!("snippet {id} not found"))
}

fn fetch_all_snippets(conn: &Connection) -> Result<Vec<Snippet>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, content, type, favorite, created_at, updated_at, pinned, archived, tags, source, sensitive
             FROM snippets ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_snippet)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

fn update_snippet_flag(
    conn: &Connection,
    id: &str,
    column: &str,
    value: bool,
) -> Result<Snippet, String> {
    let sql = format!(
        "UPDATE snippets SET {} = ?1, updated_at = ?2 WHERE id = ?3",
        column
    );
    let changed = conn
        .execute(&sql, params![value as i64, now_ms(), id])
        .map_err(|e| e.to_string())?;
    if changed == 0 {
        return Err(format!("snippet {id} not found"));
    }
    fetch_snippet(conn, id)
}

#[tauri::command]
pub fn list_snippets(db: State<'_, Db>) -> Result<Vec<Snippet>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    fetch_all_snippets(&conn)
}

#[tauri::command]
pub fn create_snippet(
    db: State<'_, Db>,
    title: String,
    content: String,
    snippet_type: String,
    tags: Option<Vec<String>>,
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
        tags: tags.unwrap_or_default(),
        created_at: now,
        updated_at: now,
        source: default_source(),
        sensitive: false,
    };
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO snippets (id, title, content, type, favorite, pinned, archived, tags, created_at, updated_at, source, sensitive)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            snippet.id,
            snippet.title,
            snippet.content,
            snippet.snippet_type,
            snippet.favorite as i64,
            snippet.pinned as i64,
            snippet.archived as i64,
            serde_json::to_string(&snippet.tags).map_err(|e| e.to_string())?,
            now,
            now,
            snippet.source,
            snippet.sensitive as i64
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
    update_snippet_flag(&conn, &id, "favorite", favorite)
}

#[tauri::command]
pub fn set_pinned(db: State<'_, Db>, id: String, pinned: bool) -> Result<Snippet, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    update_snippet_flag(&conn, &id, "pinned", pinned)
}

#[tauri::command]
pub fn set_archived(db: State<'_, Db>, id: String, archived: bool) -> Result<Snippet, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    update_snippet_flag(&conn, &id, "archived", archived)
}

#[tauri::command]
pub fn set_sensitive(db: State<'_, Db>, id: String, sensitive: bool) -> Result<Snippet, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    update_snippet_flag(&conn, &id, "sensitive", sensitive)
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
    sensitive: bool,
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
    sensitive: Option<bool>,
    tags: Option<Vec<String>>,
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
    let snippets = fetch_all_snippets(&conn)?;

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
                sensitive: s.sensitive,
                tags: s.tags,
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
        sensitive: bool,
        tags: Vec<String>,
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
            sensitive: entry.sensitive.unwrap_or(false),
            tags: entry.tags.clone().unwrap_or_default(),
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
            "INSERT INTO snippets (id, title, content, type, favorite, pinned, archived, sensitive, tags, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                entry.id,
                entry.title,
                entry.content,
                entry.snippet_type,
                entry.favorite as i64,
                entry.pinned as i64,
                entry.archived as i64,
                entry.sensitive as i64,
                serde_json::to_string(&entry.tags).map_err(|e| e.to_string())?,
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

/// Reads a value from the generic settings table. Returns None when the key
/// has never been written (e.g. first run after the feature was added).
#[tauri::command]
pub fn get_setting(db: State<'_, Db>, key: String) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![key],
        |row| row.get::<_, String>(0),
    )
    .map(Some)
    .or_else(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => Ok(None),
        other => Err(other.to_string()),
    })
}

/// Upserts a value in the generic settings table.
#[tauri::command]
pub fn set_setting(db: State<'_, Db>, key: String, value: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ---------- Automatic clipboard history ----------

const CLIPBOARD_SETTING_KEY: &str = "clipboardHistory";

static LAST_SEEN_CLIPBOARD: std::sync::Mutex<Option<String>> = std::sync::Mutex::new(None);

#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
#[serde(rename_all = "camelCase")]
struct ClipboardHistorySetting {
    enabled: bool,
    limit: usize,
}

impl Default for ClipboardHistorySetting {
    fn default() -> Self {
        Self {
            enabled: false,
            limit: 100,
        }
    }
}

fn read_clipboard_setting(conn: &Connection) -> ClipboardHistorySetting {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![CLIPBOARD_SETTING_KEY],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|raw| serde_json::from_str(&raw).ok())
    .unwrap_or_default()
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureOutcome {
    /// The snippet captured this round, if the clipboard changed.
    pub created: Option<Snippet>,
    /// Clipboard entries removed by the limit, if any.
    pub removed_ids: Vec<String>,
    /// False when capture is disabled; the frontend then skips state updates.
    pub enabled: bool,
}

/// Shortens the first non-empty line of captured text into a title.
fn title_from_content(content: &str) -> String {
    let first_line = content
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .unwrap_or("Clipboard entry");
    let mut title: String = first_line.chars().take(60).collect();
    if first_line.chars().count() > 60 {
        title.push('…');
    }
    title
}

/// Deletes the oldest auto-captured entries that exceed `limit`.
/// Manual snippets and favorites/pinned entries are never touched; when all
/// remaining captured entries are protected the prune is best-effort.
fn prune_clipboard_entries(conn: &Connection, limit: usize) -> Result<Vec<String>, String> {
    let total: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM snippets WHERE source = 'clipboard'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let excess = (total as usize).saturating_sub(limit);
    if excess == 0 {
        return Ok(Vec::new());
    }
    let removed: Vec<String> = {
        let mut stmt = conn
            .prepare(
                "SELECT id FROM snippets
                 WHERE source = 'clipboard' AND favorite = 0 AND pinned = 0
                 ORDER BY created_at ASC, id ASC
                 LIMIT ?1",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![excess as i64], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?
    };
    for id in &removed {
        conn.execute("DELETE FROM snippets WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
    }
    Ok(removed)
}

/// Poll target for the frontend: reads the system clipboard, stores new text
/// as a "clipboard" snippet (skipping duplicates and empty text), then prunes
/// auto-captured entries over the configured limit.
#[tauri::command]
pub fn capture_clipboard(
    app: AppHandle,
    db: State<'_, Db>,
) -> Result<CaptureOutcome, String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;

    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let setting = read_clipboard_setting(&conn);
    if !setting.enabled {
        return Ok(CaptureOutcome {
            created: None,
            removed_ids: Vec::new(),
            enabled: false,
        });
    }

    let text = app.clipboard().read_text().map_err(|e| e.to_string())?;
    let trimmed = text.trim();
    if trimmed.is_empty() {
        let removed_ids = prune_clipboard_entries(&conn, setting.limit)?;
        return Ok(CaptureOutcome {
            created: None,
            removed_ids,
            enabled: true,
        });
    }

    // Fast-path in-memory check: if clipboard content hasn't changed since last poll, skip DB queries.
    if let Ok(last) = LAST_SEEN_CLIPBOARD.lock() {
        if let Some(ref prev) = *last {
            if prev == trimmed {
                return Ok(CaptureOutcome {
                    created: None,
                    removed_ids: Vec::new(),
                    enabled: true,
                });
            }
        }
    }

    if let Ok(mut last) = LAST_SEEN_CLIPBOARD.lock() {
        *last = Some(trimmed.to_string());
    }

    // Same whitespace-normalized duplicate rule as manual creation/import.
    // Sensitive snippets are deliberately excluded from this comparison so
    // clipboard monitoring never matches against (or reveals the existence of)
    // protected content.
    let normalized = normalize_content(trimmed);
    let latest_duplicate = conn
        .query_row(
            "SELECT content FROM snippets WHERE sensitive = 0 ORDER BY created_at DESC LIMIT 1",
            [],
            |row| row.get::<_, String>(0),
        )
        .map(|content| normalize_content(&content) == normalized)
        .unwrap_or(false);

    let duplicate = if latest_duplicate {
        true
    } else {
        let mut stmt = conn
            .prepare("SELECT content FROM snippets WHERE sensitive = 0")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        let found = rows
            .into_iter()
            .any(|row| row.map(|content| normalize_content(&content) == normalized).unwrap_or(false));
        found
    };

    if duplicate {
        let removed_ids = prune_clipboard_entries(&conn, setting.limit)?;
        return Ok(CaptureOutcome {
            created: None,
            removed_ids,
            enabled: true,
        });
    }

    let now = now_ms();
    let snippet = Snippet {
        id: Uuid::new_v4().to_string(),
        title: title_from_content(trimmed),
        content: trimmed.to_string(),
        snippet_type: "text".to_string(),
        favorite: false,
        pinned: false,
        archived: false,
        tags: Vec::new(),
        created_at: now,
        updated_at: now,
        source: "clipboard".to_string(),
        sensitive: false,
    };
    conn.execute(
        "INSERT INTO snippets (id, title, content, type, favorite, pinned, archived, tags, created_at, updated_at, source, sensitive)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            snippet.id,
            snippet.title,
            snippet.content,
            snippet.snippet_type,
            snippet.favorite as i64,
            snippet.pinned as i64,
            snippet.archived as i64,
            serde_json::to_string(&snippet.tags).map_err(|e| e.to_string())?,
            now,
            now,
            snippet.source,
            snippet.sensitive as i64
        ],
    )
    .map_err(|e| e.to_string())?;
    let removed_ids = prune_clipboard_entries(&conn, setting.limit)?;
    Ok(CaptureOutcome {
        created: Some(snippet),
        removed_ids,
        enabled: true,
    })
}

/// Trims existing auto-captured history down to the configured limit. Called
/// by the frontend right after the limit setting changes.
#[tauri::command]
pub fn prune_clipboard_history(db: State<'_, Db>) -> Result<Vec<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let setting = read_clipboard_setting(&conn);
    prune_clipboard_entries(&conn, setting.limit)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::setup_schema;

    #[test]
    fn test_normalize_content() {
        assert_eq!(normalize_content("  hello   world  "), "hello world");
        assert_eq!(normalize_content("line1\n\n\tline2  line3"), "line1 line2 line3");
        assert_eq!(normalize_content(""), "");
    }

    #[test]
    fn test_title_from_content() {
        assert_eq!(title_from_content("First line\nSecond line"), "First line");
        assert_eq!(title_from_content("   \n\nTrimmed start"), "Trimmed start");
        assert_eq!(title_from_content(""), "Clipboard entry");

        let long_line = "a".repeat(100);
        let title = title_from_content(&long_line);
        assert_eq!(title.chars().count(), 61); // 60 chars + ellipsis
        assert!(title.ends_with('…'));
    }

    #[test]
    fn test_crud_and_flag_updates() {
        let conn = Connection::open_in_memory().unwrap();
        setup_schema(&conn).unwrap();

        let id = "test-snippet-1";
        let now = now_ms();
        conn.execute(
            "INSERT INTO snippets (id, title, content, type, favorite, pinned, archived, tags, created_at, updated_at, source, sensitive)
             VALUES (?1, ?2, ?3, ?4, 0, 0, 0, '[]', ?5, ?5, 'manual', 0)",
            params![id, "Test Title", "Test Content", "text", now],
        ).unwrap();

        let snippet = fetch_snippet(&conn, id).unwrap();
        assert_eq!(snippet.title, "Test Title");
        assert!(!snippet.favorite);
        assert!(!snippet.pinned);

        // Update flags
        let updated = update_snippet_flag(&conn, id, "favorite", true).unwrap();
        assert!(updated.favorite);

        let updated = update_snippet_flag(&conn, id, "pinned", true).unwrap();
        assert!(updated.pinned);

        let updated = update_snippet_flag(&conn, id, "sensitive", true).unwrap();
        assert!(updated.sensitive);

        let all = fetch_all_snippets(&conn).unwrap();
        assert_eq!(all.len(), 1);
        assert_eq!(all[0].id, id);
    }
}
