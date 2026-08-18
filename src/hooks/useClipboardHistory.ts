import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Snippet } from "../types";
import {
  DEFAULT_CLIPBOARD_HISTORY,
  loadClipboardHistory,
  saveClipboardHistory,
  type ClipboardHistorySetting,
} from "../lib/settings";

const POLL_INTERVAL_MS = 1500;

interface CaptureOutcome {
  created: Snippet | null;
  removedIds: string[];
  enabled: boolean;
}

interface UseClipboardHistoryOptions {
  /** Called when the poll captured a new clipboard entry. */
  onCapture: (snippet: Snippet) => void;
  /** Called when the limit pruned auto-captured entries. */
  onRemove: (ids: string[]) => void;
  /** Called when saving or syncing settings fails. */
  onError?: (message: string) => void;
}

/**
 * Drives automatic clipboard capture. While enabled, polls the backend
 * `capture_clipboard` command, which stores new clipboard text and prunes
 * the oldest auto-captured entries over the configured limit. Manual
 * snippets and favorites/pinned entries are never pruned (enforced in SQL).
 */
export default function useClipboardHistory({
  onCapture,
  onRemove,
  onError,
}: UseClipboardHistoryOptions) {
  const [setting, setSetting] =
    useState<ClipboardHistorySetting>(DEFAULT_CLIPBOARD_HISTORY);

  const callbacksRef = useRef({ onCapture, onRemove, onError });
  callbacksRef.current = { onCapture, onRemove, onError };
  const initializedRef = useRef(false);
  const inFlightRef = useRef(false);

  // One-shot bootstrap: adopt the persisted setting.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadClipboardHistory().then(setSetting).catch((err) => {
      callbacksRef.current.onError?.(`Failed to load clipboard settings: ${String(err)}`);
    });
  }, []);

  // Poll only while enabled; a single guard prevents overlapping invokes.
  useEffect(() => {
    if (!setting.enabled) return;
    const timer = window.setInterval(async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const outcome = await invoke<CaptureOutcome>("capture_clipboard");
        if (!outcome.enabled) return;
        if (outcome.created) callbacksRef.current.onCapture(outcome.created);
        if (outcome.removedIds.length > 0) {
          callbacksRef.current.onRemove(outcome.removedIds);
        }
      } catch {
        // Transient failures (e.g. non-text on the clipboard) are skipped;
        // the next tick retries.
      } finally {
        inFlightRef.current = false;
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [setting.enabled]);

  const update = useCallback(async (next: ClipboardHistorySetting) => {
    setSetting(next);
    try {
      await saveClipboardHistory(next);
      // Lowering the limit should trim immediately, not only on the next
      // capture. Disabled captures are still pruned by the backend.
      const removed = await invoke<string[]>("prune_clipboard_history");
      if (removed.length > 0) callbacksRef.current.onRemove(removed);
    } catch (err) {
      callbacksRef.current.onError?.(
        `Failed to save clipboard history settings: ${String(err)}`,
      );
    }
  }, []);

  return { setting, update };
}
