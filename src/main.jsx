import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";
import { MotionConfig } from "motion/react";
import { SeasonProvider } from "./context/SeasonContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import './index.css'
import App from './App.jsx'
import { WEEK } from "./hooks/queries";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Off by default; live-season queries opt back in (LIVE in hooks/queries.js).
      refetchOnWindowFocus: false,
      retry: 2,
      // Back off generously: most failures are Jolpica rate limits (429).
      retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 15000),
    },
  },
});

// History-tier queries (meta.persist) are saved to IndexedDB, which has room for whole seasons
// of results where localStorage's ~5 MB doesn't. If IndexedDB is unavailable (some private
// modes), restoring fails quietly and the app fetches as before.
const persister = createAsyncStoragePersister({
  storage: { getItem: get, setItem: set, removeItem: del },
  key: "f1:queryCache",
  throttleTime: 2000,
});
const persistOptions = {
  persister,
  maxAge: WEEK,
  // Bump when a stored query's data shape changes; older caches are then dropped.
  buster: "1",
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => query.state.status === "success" && query.meta?.persist === true,
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <BrowserRouter>
        <LanguageProvider>
          <SeasonProvider>
            {/* reducedMotion="user": transforms and layout animations drop out, opacity fades stay. */}
            <MotionConfig reducedMotion="user">
              <App />
            </MotionConfig>
          </SeasonProvider>
        </LanguageProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>,
)
