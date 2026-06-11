import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshIcon } from './icons';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  // Explicitly declare props to satisfy TypeScript inference
  public readonly props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-red-600 rounded-lg p-6 max-w-lg w-full shadow-2xl text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-4">
              The application encountered an unexpected error. This might be due to a data issue or a temporary glitch.
            </p>
            <div className="bg-black/50 p-3 rounded text-left overflow-auto max-h-32 mb-6">
                <code className="text-red-300 text-xs font-mono whitespace-pre-wrap">
                    {this.state.error?.toString()}
                </code>
            </div>
            <div className="flex justify-center space-x-4">
                <button 
                    onClick={this.handleReload}
                    className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-semibold transition-colors text-white"
                >
                    <RefreshIcon className="w-4 h-4" />
                    <span>Reload Application</span>
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
                Tip: If this persists, try clearing your browser cache or downloading the latest auto-save from the "Project" tab if possible.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}