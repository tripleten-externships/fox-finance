import "@fox-finance/theme/styles/globals.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@fox-finance/theme";
import { Toaster } from "@fox-finance/ui";
import App from "./App.tsx";

createRoot(document.getElementById("root") as Element).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster position="top-center" />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
