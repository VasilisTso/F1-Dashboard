import { LuExternalLink } from "react-icons/lu";
import { Card, Skeleton } from "./ui";
import { useI18n } from "../i18n/LanguageContext";

// "About" card from a Wikipedia summary (see getWikiSummary). The link goes to the article actually
// shown; in Greek, a note says when only the English article exists.
export function WikiIntro({ wiki, isPending, fallbackUrl }) {
  const { t, lang } = useI18n();
  const href = wiki?.content_urls?.desktop?.page ?? fallbackUrl;
  // Only a real fallback: placeholder data from the previous language was requested in that language.
  const fellBack = wiki && wiki.requested === lang && wiki.lang !== lang;
  return (
    <Card title={t("common.wiki.about")} className="h-full">
      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : (
        <>
          {wiki?.extract ? (
            <p lang={wiki.lang} className="max-w-prose text-ink-2 text-pretty">
              {wiki.extract}
            </p>
          ) : (
            <p className="text-sm text-ink-2">{t("common.wiki.none")}</p>
          )}
          {fellBack && wiki?.extract && <p className="mt-3 text-xs text-ink-3">{t("common.wiki.englishOnly")}</p>}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              hrefLang={wiki?.lang}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-line-strong hover:decoration-ink"
            >
              {t("common.wiki.readMore")} <LuExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">{t("common.wiki.newTab")}</span>
            </a>
          )}
        </>
      )}
    </Card>
  );
}
