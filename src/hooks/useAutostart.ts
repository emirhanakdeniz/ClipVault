import { useEffect, useState, useCallback } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

export interface UseAutostartResult {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  toggle: (enableAutostart: boolean) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing automatic launch at Windows system startup.
 * Defaults to false and persists OS registry state via tauri-plugin-autostart.
 */
export function useAutostart(): UseAutostartResult {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const active = await isEnabled();
      setEnabled(active);
      setError(null);
    } catch (err) {
      // In dev or web environment without Tauri autostart capability, fail gracefully.
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (enableAutostart: boolean): Promise<boolean> => {
      try {
        setError(null);
        if (enableAutostart) {
          await enable();
          setEnabled(true);
        } else {
          await disable();
          setEnabled(false);
        }
        return true;
      } catch (err) {
        const message = String(err);
        setError(`Failed to update autostart setting: ${message}`);
        // Re-sync with actual OS state
        try {
          const actual = await isEnabled();
          setEnabled(actual);
        } catch {
          // ignore
        }
        return false;
      }
    },
    [],
  );

  return {
    enabled,
    loading,
    error,
    toggle,
    refresh,
  };
}
