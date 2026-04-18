import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthFeature } from "./features/auth";
import { UploadPortal } from "./features/upload-portal/pages/Upload";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoutes } from "./components/ProtectedRoutes";
import DashboardLayout from "./features/dashboard/DashboardLayout";
import LinkAnalytics from "./features/upload-links/pages/LinkAnalytics";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public upload route - no authentication required */}
          <Route path="/upload/:token" element={<UploadPortal />} />

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
                  <Route path="/dashboard/analytics" element={<LinkAnalytics />}/>
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
