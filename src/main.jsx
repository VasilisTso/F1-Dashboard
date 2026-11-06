import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SeasonProvider } from "./context/SeasonContext";
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
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
        <SeasonProvider>
          <App />
        </SeasonProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
