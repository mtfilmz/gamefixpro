import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("App ErrorBoundary:", error, info);
  }

  handleReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 space-y-4">
            <h1 className="text-xl font-bold text-foreground">Algo salió mal</h1>
            <p className="text-sm text-muted-foreground">
              La aplicación no pudo cargar. Esto puede pasar en navegadores con modo privado o cookies bloqueadas.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40 text-foreground">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-bold"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
