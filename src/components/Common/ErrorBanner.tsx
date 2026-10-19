import React from 'react';
import { AlertCircle, RefreshCw, AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  error: string | null;
  isStale: boolean;
  onRetry: () => void;
  isRetrying: boolean;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  isStale,
  onRetry,
  isRetrying,
  onDismiss,
}) => {
  if (!error) return null;

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 shadow-md transition-all ${
        isStale
          ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
          : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {isStale ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {isStale
                ? 'USGS Sync Warning — Showing Stale Cached Telemetry'
                : 'Unable to Connect to USGS Earthquake API'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {error}
            </p>
            {isStale && (
              <p className="text-[11px] text-amber-300/80 mt-1">
                Notice: Existing verified records are preserved on your dashboard until connection is restored.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow transition-all ${
              isStale
                ? 'bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900'
                : 'bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded text-slate-400 hover:text-white"
              aria-label="Dismiss error notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
