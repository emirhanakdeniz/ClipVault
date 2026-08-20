import { useEffect } from "react";

interface NotificationRegionProps {
  success: string | null;
  error: string | null;
  onDismissSuccess: () => void;
  onDismissError: () => void;
}

export default function NotificationRegion({
  success,
  error,
  onDismissSuccess,
  onDismissError,
}: NotificationRegionProps) {
  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(onDismissSuccess, 2800);
    return () => window.clearTimeout(timer);
  }, [success, onDismissSuccess]);

  if (!success && !error) return null;

  return (
    <div className="notification-region" aria-label="Notifications">
      {error && (
        <div className="notification notification--error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onDismissError} aria-label="Dismiss error">×</button>
        </div>
      )}
      {success && (
        <div className="notification notification--success" role="status">
          <span>{success}</span>
          <button type="button" onClick={onDismissSuccess} aria-label="Dismiss notification">×</button>
        </div>
      )}
    </div>
  );
}
