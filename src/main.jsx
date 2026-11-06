import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { SeasonProvider } from "./context/SeasonContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import './index.css'
import App from './App.jsx'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  </StrictMode>,
)
