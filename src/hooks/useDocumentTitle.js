import { useEffect } from "react";
import { useT } from "../i18n/LanguageContext";

// Sets the tab title: "Hamilton · 2021 · F1 Dashboard". Empty parts are skipped, so pages can pass
// a name that is still loading or a season that only applies when it isn't the current one.
export function useDocumentTitle(...parts) {
  const t = useT();
  const title = [...parts, t("common.appName")].filter(Boolean).join(" · ");
  useEffect(() => {
    document.title = title;
  }, [title]);
}
