import { Component, type ReactNode } from "react";

/**
 * Sem isso, qualquer exceção durante a renderização derruba a árvore React inteira e
 * deixa só o fundo escuro do body visível (tela preta), sem nenhuma pista pro usuário.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-6 text-center">
          <div>
            <p className="mb-2 text-sm text-white">Ocorreu um erro inesperado.</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-orange-500/10 px-4 py-2 text-xs font-medium text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-500/20"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
