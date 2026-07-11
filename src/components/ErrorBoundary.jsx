import React from "react";
import { G } from "../constants/tokens.js";

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) { console.error("ErrorBoundary:", error, info); }

  render() {
    if (this.state.error) {
      return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:16, padding:24 }}>
          <div style={{ fontSize:48 }}>⚠️</div>
          <div style={{ fontSize:16, fontWeight:600, color:G.text }}>Something went wrong</div>
          <div style={{ fontSize:13, color:G.muted, textAlign:"center", maxWidth:280 }}>
            {this.state.error.message || "An unexpected error occurred."}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding:"10px 24px", background:G.accent, color:"#000", borderRadius:10, fontSize:13, fontWeight:700, border:"none" }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
