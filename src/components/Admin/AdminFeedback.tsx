import { X } from "lucide-react";
import { useEffect } from "react";

type FeedbackVariant = "success" | "error" | "info";

export interface AdminFeedbackProps {
  message: string;
  variant?: FeedbackVariant;
  onDismiss?: () => void;
  autoHideMs?: number;
}

const variantStyles: Record<FeedbackVariant, string> = {
  success: "bg-boho-sage/20 border-boho-sage/40 text-boho-brown",
  error: "bg-boho-terracotta/15 border-boho-terracotta/40 text-boho-terracotta",
  info: "bg-boho-cream/60 border-boho-brown/20 text-boho-brown",
};

export function AdminFeedback({
  message,
  variant = "info",
  onDismiss,
  autoHideMs,
}: AdminFeedbackProps) {
  useEffect(() => {
    if (!autoHideMs || !onDismiss) return;
    const timeout = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(timeout);
  }, [autoHideMs, onDismiss]);

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-[var(--ever-radius-md)] border px-4 py-3 text-sm shadow-sm ${variantStyles[variant]}`}
    >
      <span className="font-medium">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-boho p-1 text-current transition hover:bg-white/20"
          aria-label="Затвори съобщението"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
