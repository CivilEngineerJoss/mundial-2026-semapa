import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminPage } from "./pages/AdminPage";
import { ConfirmedPage } from "./pages/ConfirmedPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RankingPage } from "./pages/RankingPage";
import { ValidationPage } from "./pages/ValidationPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/confirmados" element={<ConfirmedPage />} />
            <Route path="/validar/:code" element={<ValidationPage />} />
            <Route path="/admin" element={<ProtectedRoute admin><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>,
);
