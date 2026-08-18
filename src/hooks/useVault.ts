import { useCallback, useEffect, useState } from "react";
import type { EncryptionStatus } from "../types";
import {
  getEncryptionStatus,
  setupEncryption,
  unlockVault,
  lockVault,
  changeVaultPassphrase,
  disableEncryption,
} from "../lib/api";

export function useVault(onStatusChange?: () => void) {
  const [status, setStatus] = useState<EncryptionStatus>({
    configured: false,
    unlocked: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const nextStatus = await getEncryptionStatus();
      setStatus(nextStatus);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setup = async (passphrase: string) => {
    try {
      await setupEncryption(passphrase);
      await refresh();
      onStatusChange?.();
    } catch (err) {
      setError(String(err));
      throw err;
    }
  };

  const unlock = async (passphrase: string) => {
    try {
      await unlockVault(passphrase);
      await refresh();
      onStatusChange?.();
    } catch (err) {
      setError(String(err));
      throw err;
    }
  };

  const lock = async () => {
    try {
      await lockVault();
      await refresh();
      onStatusChange?.();
    } catch (err) {
      setError(String(err));
      throw err;
    }
  };

  const changePassphrase = async (
    oldPassphrase: string,
    newPassphrase: string,
  ) => {
    try {
      await changeVaultPassphrase(oldPassphrase, newPassphrase);
      await refresh();
      onStatusChange?.();
    } catch (err) {
      setError(String(err));
      throw err;
    }
  };

  const disable = async (passphrase: string) => {
    try {
      await disableEncryption(passphrase);
      await refresh();
      onStatusChange?.();
    } catch (err) {
      setError(String(err));
      throw err;
    }
  };

  return {
    status,
    loading,
    error,
    setError,
    refresh,
    setup,
    unlock,
    lock,
    changePassphrase,
    disable,
  };
}
