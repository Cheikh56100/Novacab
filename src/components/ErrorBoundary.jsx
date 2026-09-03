import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Une erreur inattendue est survenue." };
  }

  componentDidCatch(error, info) {
    console.error("NOVACAB UI error", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--color-app, #f8fafc)", color: "var(--color-ink, #0f172a)", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ width: "min(520px, 100%)", padding: 24, borderRadius: 16, border: "1px solid var(--color-line, #e2e8f0)", background: "var(--color-card, #fff)", boxShadow: "0 12px 32px rgba(15,23,42,.08)" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 18 }}>NOVACAB a rencontré un problème</h1>
          <p style={{ margin: "0 0 16px", fontSize: 13, lineHeight: 1.6, opacity: .75 }}>La page a été protégée pour éviter qu'une erreur d'interface ne bloque toute l'application.</p>
          <button type="button" onClick={this.handleReset} style={{ border: 0, borderRadius: 9, padding: "9px 13px", cursor: "pointer", fontWeight: 700 }}>Réessayer</button>
          {this.state.message && <details style={{ marginTop: 14, fontSize: 11, opacity: .65 }}><summary>Détail technique</summary><pre style={{ whiteSpace: "pre-wrap" }}>{this.state.message}</pre></details>}
        </div>
      </div>
    );
  }
}
