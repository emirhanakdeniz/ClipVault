# ClipVault 📋⚡

A lightweight, privacy-focused desktop snippet and clipboard manager built with **Tauri v2**, **React**, **TypeScript**, and **Rust (SQLite)**.

Designed for developers and power users who want a fast, keyboard-driven way to store, organize, and retrieve snippets without relying on third-party cloud services.

---

## ✨ Features

- **⚡ Quick Capture & Organization**: Rapidly capture snippets categorized by type (`code`, `text`, `link`) and organize them with custom tags.
- **📌 Pin, Favorite & Archive**: Keep critical snippets pinned to the top, favorite frequently used items, and archive obsolete items safely.
- **🔍 Real-Time Search & Filtering**: Instant search across titles, content, and tags with filters for types, tags, and date sorting.
- **🛡️ Duplicate Prevention**: Whitespace-normalized duplicate detection prevents redundant entries without accidental overwrites.
- **📦 Bulk Operations**: Select multiple items to bulk archive, favorite, or delete.
- **⌨️ Keyboard Shortcuts**:
  - `Ctrl+K` (`Cmd+K`): Focus Search
  - `Ctrl+I` (`Cmd+I`): Focus Quick Capture
  - `Ctrl+N` (`Cmd+N`): Open New Snippet Form
  - `Ctrl+C` (`Cmd+C`): Copy Selected Snippet
  - `Ctrl+D` (`Cmd+D`): Toggle Favorite
- **🌍 Global Quick Capture Shortcut** *(optional)*: A system-wide shortcut (default suggestion `Ctrl+Alt+V`, disabled by default) that opens/focuses ClipVault's Quick Capture from any application. Configure or re-record it in the sidebar; the choice is persisted locally, conflicts with other apps are reported instead of failing silently, and the feature stays off if registration fails.
- **🔒 100% Local & Private**: All data is persisted locally in an embedded SQLite database (`rusqlite`) in your OS app data folder. Zero telemetry, zero cloud lock-in.
- **💾 Import & Export**: Versioned JSON backup and restore with built-in schema validation and duplicate skipping.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), Vanilla CSS
- **Backend / Desktop**: [Tauri v2](https://tauri.app/), [Rust](https://www.rust-lang.org/)
- **Database**: [SQLite](https://www.sqlite.org/) via [`rusqlite`](https://crates.io/crates/rusqlite) (bundled)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher) & `npm`
- [Rust & Cargo](https://rustup.rs/)
- [Tauri Prerequisites](https://tauri.app/start/prerequisites/) for your operating system

### Installation & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/clipvault.git
   cd clipvault
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Run the application in development mode:**
   ```bash
   npm run tauri dev
   ```

4. **Build for production:**
   ```bash
   npm run tauri build
   ```

---

## 📂 Project Structure

```text
ClipVault/
├── src/                      # React frontend source
│   ├── components/           # UI components (Sidebar, SearchBar, SnippetCard, etc.)
│   ├── hooks/                # Custom React hooks (useShortcuts, etc.)
│   ├── lib/                  # Utilities (API IPC bridge, search, shortcuts, duplicates)
│   ├── views/                # Main views (SnippetsView, FavoritesView, ArchiveView)
│   ├── App.tsx               # Main application component & state management
│   ├── styles.css            # Custom styling & themes
│   └── types.ts              # Core TypeScript interfaces & types
├── src-tauri/                # Rust backend source
│   ├── src/
│   │   ├── commands.rs       # Tauri IPC commands (CRUD, import/export)
│   │   ├── db.rs             # SQLite connection & schema migrations
│   │   └── main.rs           # Tauri application entry point
│   ├── Cargo.toml            # Rust dependencies & metadata
│   └── tauri.conf.json       # Tauri app configuration
├── package.json
└── tsconfig.json
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
