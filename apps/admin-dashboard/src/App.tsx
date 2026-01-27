import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthFeature } from "./features/auth";
import { DocumentUpload } from "./features/upload";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoutes } from "./components/ProtectedRoutes";
import DashboardLayout from "./features/dashboard/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public upload route - no authentication required */}
          <Route path="/upload/:token" element={<DocumentUpload />} />

          {/* Auth routes */}
          <Route path="/auth/*" element={<AuthFeature />} />

          {/* Protected admin routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoutes>
                <Routes>
                  <Route path="/dashboard" element={<DashboardLayout />} />
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
