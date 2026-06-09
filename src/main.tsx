import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminPage } from "./pages/AdminPage";
import { ConfirmedPage } from "./pages/ConfirmedPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RankingPage } from "./pages/RankingPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ValidationPage } from "./pages/ValidationPage";
import "./index.css";

function FallbackRoute() {
  const { passwordRecovery } = useAuth();
  return <Navigate to={passwordRecovery ? "/reset-password" : "/"} replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/confirmados" element={<ConfirmedPage />} />
            <Route path="/validar/:code" element={<ValidationPage />} />
            <Route path="/admin" element={<ProtectedRoute admin><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<FallbackRoute />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>,
);
