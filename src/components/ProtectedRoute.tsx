import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { SupabaseSetupNotice } from "./SupabaseSetupNotice";
import { isSupabaseConfigured } from "../lib/supabase";

export function ProtectedRoute({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { loading, user, profile, passwordRecovery } = useAuth();
  if (!isSupabaseConfigured) return <SupabaseSetupNotice />;
  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando sesion...</div>;
  if (passwordRecovery) return <Navigate to="/reset-password" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && profile?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}
