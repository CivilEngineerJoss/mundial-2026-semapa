import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { supabase } from "../lib/supabase";

export function ResetPasswordPage() {
  const { user, loading: authLoading, passwordRecovery, clearPasswordRecovery } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return <div className="p-8 text-center text-muted-foreground">Validando enlace de recuperacion...</div>;
  if (!user && !passwordRecovery) return <Navigate to="/login" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (password.length < 6) {
      setMessage("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    clearPasswordRecovery();
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle>Nueva contrasena</CardTitle>
        </CardHeader>
        <CardContent>
          {!user && (
            <p className="mb-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Si esta pantalla no permite guardar, solicite un nuevo correo de recuperacion desde la pagina de inicio de sesion.
            </p>
          )}
          <form className="space-y-3" onSubmit={submit}>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nueva contrasena" minLength={6} required />
            <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirmar contrasena" minLength={6} required />
            <Button className="w-full" disabled={loading}>
              <KeyRound size={17} /> {loading ? "Guardando..." : "Guardar nueva contrasena"}
            </Button>
          </form>
          {message && <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
