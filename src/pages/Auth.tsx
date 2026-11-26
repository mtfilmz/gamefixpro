import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Clave del correo recordado en este dispositivo.
const REMEMBER_KEY = "gfp_remembered_email";
type PasswordCredentialCtor = new (data: { id: string; password: string }) => Credential;

// El correo se guarda en este dispositivo y la contraseña en el gestor de contraseñas del navegador
// (Chrome/Google, Safari/iCloud), nunca dentro de la app.
async function savePasswordInBrowser(email: string, password: string) {
  try {
    const P = (window as unknown as { PasswordCredential?: PasswordCredentialCtor }).PasswordCredential;
    if (P && navigator.credentials) await navigator.credentials.store(new P({ id: email, password }));
  } catch {
    // El navegador no permite guardar la contraseña desde la app.
  }
}

async function readPasswordFromBrowser(): Promise<{ id: string; password: string } | null> {
  try {
    if (!("PasswordCredential" in window) || !navigator.credentials) return null;
    const c = (await navigator.credentials.get({
      password: true,
      mediation: "optional",
    } as CredentialRequestOptions)) as (Credential & { password?: string }) | null;
    return c && c.password ? { id: c.id, password: c.password } : null;
  } catch {
    return null;
  }
}

const Auth = () => {
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (!saved) return;
    let active = true;
    void readPasswordFromBrowser().then((c) => {
      if (!active || !c) return;
      setEmail(c.id || saved);
      setPassword(c.password);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
        await savePasswordInBrowser(email, password);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      navigate("/");
    }
    setLoading(false);
  };

  const inputClass =
    "w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-primary px-6 py-5 text-center">
          <h1 className="text-2xl font-bold text-primary-foreground">Gaming Fix</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Correo electrónico</label>
            <input
              type="email"
              name="email"
              autoComplete="username"
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
              name="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              minLength={6}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => {
                setRememberMe(e.target.checked);
                if (!e.target.checked) localStorage.removeItem(REMEMBER_KEY);
              }}
              className="accent-primary w-4 h-4"
            />
            <span className="text-sm text-muted-foreground">Recordar correo y contraseña</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>

          <p className="text-center text-xs text-muted-foreground">Solo un administrador puede crear cuentas nuevas.</p>
        </form>
      </div>
    </div>
  );
};

export default Auth;
