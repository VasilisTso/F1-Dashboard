/* NOT WORKING MAYBE COME BACK LATER */
import React, { createContext, useContext, useState } from "react";

// Create the context
const SeasonContext = createContext();

// Provider component to wrap your whole app
export function SeasonProvider({ children }) {
  const [season, setSeason] = useState("current"); // default = current season

  return (
    <SeasonContext.Provider value={{ season, setSeason }}>
      {children}
    </SeasonContext.Provider>
  );
};

// Custom hook for easy use
export function useSeason() {
  return useContext(SeasonContext);
}
