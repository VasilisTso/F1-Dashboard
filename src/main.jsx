import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { SeasonProvider } from "./context/SeasonContext";
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SeasonProvider>
        <App />
      </SeasonProvider>
    </BrowserRouter>
  </StrictMode>,
)
