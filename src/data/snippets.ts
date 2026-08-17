import type { Snippet } from "../types";

// Mock data for Phase 2. Replaced by real storage in a later phase.
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const MOCK_SNIPPETS: Snippet[] = [
  {
    id: "1",
    title: "Interactive rebase",
    content: "git rebase -i HEAD~3",
    type: "code",
    favorite: true,
    createdAt: Date.now() - 2 * HOUR,
  },
  {
    id: "2",
    title: "API base URL (staging)",
    content: "https://api.staging.clipvault.dev/v2",
    type: "link",
    favorite: false,
    createdAt: Date.now() - 5 * HOUR,
  },
  {
    id: "3",
    title: "Force IPv4 on ping",
    content: "ping -4 api.example.com",
    type: "code",
    favorite: false,
    createdAt: Date.now() - 9 * HOUR,
  },
  {
    id: "4",
    title: "Docker: remove dangling images",
    content: "docker image prune -f --filter \"dangling=true\"",
    type: "code",
    favorite: true,
    createdAt: Date.now() - 1 * DAY,
  },
  {
    id: "5",
    title: "Standup notes template",
    content:
      "Yesterday: shipped search. Today: snippet card polish. Blockers: none.",
    type: "text",
    favorite: false,
    createdAt: Date.now() - 2 * DAY,
  },
  {
    id: "6",
    title: "Cargo clean build, full check",
    content: "cargo clean && cargo check --all-targets",
    type: "code",
    favorite: false,
    createdAt: Date.now() - 3 * DAY,
  },
  {
    id: "7",
    title: "Tauri docs — window customization",
    content: "https://v2.tauri.app/learn/window-customization/",
    type: "link",
    favorite: false,
    createdAt: Date.now() - 4 * DAY,
  },
  {
    id: "8",
    title: "Commit message convention",
    content: "feat: add snippet search\n\nfixes #142",
    type: "text",
    favorite: false,
    createdAt: Date.now() - 6 * DAY,
  },
];
