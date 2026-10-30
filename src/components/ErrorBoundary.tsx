import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props: Props;
  public state: State;
  public setState!: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Orderi ErrorBoundary] Uncaught React exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-[300px] w-full flex items-center justify-center p-4 bg-slate-950 text-white rounded-3xl border border-rose-900/50 shadow-2xl my-4"
          dir="rtl"
        >
          <div className="max-w-md w-full text-center space-y-4 p-6 bg-slate-900/90 rounded-2xl border border-slate-800">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-rose-400 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-rose-200">
                {this.props.fallbackTitle || 'حدث تنبيه غير متوقع في هذه الواجهة'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تم احتواء التنبيه تلقائياً دون التأثير على عمل رادار الطلبات أو إشعارات الخلفية.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-rose-300 font-mono text-right overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة 🔄</span>
              </button>

              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer active:scale-95"
              >
                <Home className="w-3.5 h-3.5" />
                <span>تحديث التطبيق</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
