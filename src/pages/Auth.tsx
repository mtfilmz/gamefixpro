import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Revisa tu correo para confirmar tu cuenta.");
      }
    }
    setLoading(false);
  };

  const inputClass =
    "w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-primary px-6 py-5 text-center">
          <h1 className="text-2xl font-bold text-primary-foreground">🎮 Game Fix Pro</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">
            {isLogin ? "Inicia sesión para continuar" : "Crea tu cuenta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-primary/20 border border-primary/50 text-foreground rounded-lg px-4 py-2 text-sm">
              {message}
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Correo electrónico</label>
            <input
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;
