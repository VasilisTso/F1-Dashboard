import { Component } from "react";
import { ErrorState } from "./ui";
import { useT } from "../i18n/LanguageContext";

// A deploy replaces hashed chunks; a tab opened before it fails to load lazy pages until reloaded.
const isChunkError = (error) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    error?.message ?? ""
  );

// Fast refresh can't track class components, so this file falls back to a full reload on edit.
// eslint-disable-next-line react-refresh/only-export-components
function CrashState({ error, onReset }) {
  const t = useT();
  const chunk = isChunkError(error);
  return (
    <ErrorState
      title={t("common.error.crashTitle")}
      titleAs="h1"
      message={t(chunk ? "common.error.updateMessage" : "common.error.crashMessage")}
      onRetry={chunk ? () => window.location.reload() : onReset}
    />
  );
}

// Catches render errors in a page so one bad API shape never blanks the whole app.
// It sits inside App's route-keyed wrapper, so navigating elsewhere remounts it and clears the error.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) return <CrashState error={this.state.error} onReset={this.reset} />;
    return this.props.children;
  }
}
