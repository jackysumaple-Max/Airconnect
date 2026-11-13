import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface CrmErrorBoundaryProps {
  children: React.ReactNode;
  resetKey?: string;
  sectionLabel?: string;
  onRetry?: () => void;
  fallbackActionLabel?: string;
  onFallbackAction?: () => void;
}

interface CrmErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class CrmErrorBoundary extends React.Component<CrmErrorBoundaryProps, CrmErrorBoundaryState> {
  constructor(props: CrmErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): CrmErrorBoundaryState {
    const msg = error instanceof Error ? error.message : String(error || 'Unexpected UI error');
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error(`[CrmErrorBoundary${this.props.sectionLabel ? ` - ${this.props.sectionLabel}` : ''}]:`, error, info);
  }

  componentDidUpdate(prevProps: CrmErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/90 p-6 text-xs text-rose-950 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-rose-950">
                {this.props.sectionLabel ? `${this.props.sectionLabel} encountered a display error` : 'Section display error'}
              </h3>
              <p className="text-rose-800 font-medium">
                {this.state.errorMessage || 'A rendering error occurred in this view. Navigation and other tabs remain available.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload View</span>
            </button>

            {this.props.onFallbackAction && (
              <button
                type="button"
                onClick={this.props.onFallbackAction}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-100 px-3.5 py-2 text-xs font-bold text-rose-900 transition-colors cursor-pointer"
              >
                <span>{this.props.fallbackActionLabel || 'Return'}</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
