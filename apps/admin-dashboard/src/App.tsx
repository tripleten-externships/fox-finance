import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthFeature } from "./features/auth";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoutes } from "./components/ProtectedRoutes";

import { ClientDetails } from "./features/clients/components/ClientDetails";
import React from "react";

function App() {
  const [open, setOpen] = React.useState(true)

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth/*" element={<AuthFeature />} />
          <Route
            path="/*"
            element={
              <ProtectedRoutes>
                <Routes>
                  <Route path="/dashboard" element={<ClientDetails clientId="123" isOpen={open} onClose={() => setOpen(false)} />} />
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </ProtectedRoutes>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
