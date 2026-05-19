import { useState, useEffect } from "react";
import Input from "../components/Input";
import AuthLayout from "../layouts/AuthLayout";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { User, Lock, AlertTriangle, ShieldOff, Clock, Smartphone, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getDeviceFingerprint, getDeviceLabel } from "../utils/fingerprint";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatCountdown(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [correo, setCorreo]   = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState(null); // "PENDING" | "REJECTED"

  // Persistir bloqueo a través de refrescos de página
  const [lockUntil, setLockUntil] = useState(() => {
    const saved = sessionStorage.getItem("baru_lock_until");
    if (saved) {
      const d = new Date(saved);
      if (d > new Date()) return d;
      sessionStorage.removeItem("baru_lock_until");
    }
    return null;
  });
  const [permanent, setPermanent] = useState(
    () => sessionStorage.getItem("baru_perm_lock") === "1"
  );

  // Countdown en segundos
  const [countdown, setCountdown] = useState(() =>
    lockUntil ? Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000)) : 0
  );

  useEffect(() => {
    if (!lockUntil) { setCountdown(0); return; }
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockUntil.getTime() - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        clearInterval(id);
        setLockUntil(null);
        sessionStorage.removeItem("baru_lock_until");
        setError("");
        setAttemptsLeft(3);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockUntil]);

  const isLocked = permanent || (lockUntil && countdown > 0);

  // Auto-dismiss del error de credenciales después de 5 s (no aplica a bloqueos)
  useEffect(() => {
    if (!error || isLocked || permanent) return;
    const id = setTimeout(() => {
      setError("");
      setAttemptsLeft(null);
    }, 5000);
    return () => clearTimeout(id);
  }, [error, isLocked, permanent]);

  const validate = () => {
    if (!correo || !password) { setError("Todos los campos son obligatorios"); return false; }
    if (!EMAIL_RE.test(correo))  { setError("Ingresa un correo electrónico válido"); return false; }
    if (password.length < 6)     { setError("La contraseña debe tener al menos 6 caracteres"); return false; }
    return true;
  };

  const handleLogin = async () => {
    if (isLocked || loading) return;
    if (!validate()) return;

    setError("");
    setLoading(true);

    try {
      const fingerprint = await getDeviceFingerprint();
      const deviceLabel = getDeviceLabel();
      const user = await login(correo, password, fingerprint, deviceLabel);
      if (user.firstLogin) navigate("/cambiar-password");
      else navigate("/dashboard");
    } catch (err) {
      const data   = err.response?.data || {};
      const status = err.response?.status;

      if (status === 403 && data.error === "DEVICE_PENDING") {
        setDeviceStatus("PENDING");
      } else if (status === 403 && data.error === "DEVICE_REJECTED") {
        setDeviceStatus("REJECTED");
      } else if (status === 429 && data.lockUntil) {
        const until = new Date(data.lockUntil);
        setLockUntil(until);
        setCountdown(Math.max(0, Math.ceil((until.getTime() - Date.now()) / 1000)));
        sessionStorage.setItem("baru_lock_until", until.toISOString());
        setAttemptsLeft(null);
        setError(data.error || "Cuenta bloqueada temporalmente");
      } else if (status === 403) {
        setPermanent(true);
        sessionStorage.setItem("baru_perm_lock", "1");
        setError(data.error || "Cuenta bloqueada permanentemente");
      } else {
        setError(data.error || "Credenciales incorrectas");
        if (data.attemptsRemaining !== undefined) setAttemptsLeft(data.attemptsRemaining);
        else setAttemptsLeft(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <AuthLayout>
      <div className="w-96 p-8 pt-10 rounded-2xl bg-white dark:bg-[#111827] shadow-2xl border border-gray-200 dark:border-gray-700">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`w-14 h-14 flex items-center justify-center rounded-full shadow-inner transition-colors ${
              permanent ? "bg-red-100 dark:bg-red-900/40" :
              isLocked  ? "bg-amber-100 dark:bg-amber-900/40" :
                          "bg-gray-200 dark:bg-gray-800"
            }`}>
              {permanent  ? <ShieldOff className="w-6 h-6 text-red-500" /> :
               isLocked   ? <Lock      className="w-6 h-6 text-amber-500" /> :
                            <User      className="w-6 h-6 text-gray-700 dark:text-white" />}
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Bienvenido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Accede con tu cuenta institucional</p>
        </div>

        {/* Dispositivo pendiente de aprobación */}
        {deviceStatus === "PENDING" && (
          <div className="mb-5 p-5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Dispositivo no autorizado</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-300/70 leading-relaxed">
              Este dispositivo fue registrado y está <strong>en revisión</strong>.<br />
              RRHH revisará la solicitud y te avisará cuando puedas acceder.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-amber-500/70 dark:text-amber-400/50">
              <CheckCircle className="w-3.5 h-3.5" />
              Solicitud enviada a RRHH
            </div>
            <button
              onClick={() => setDeviceStatus(null)}
              className="w-full py-2 rounded-xl border border-amber-300 dark:border-amber-500/30 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}

        {/* Dispositivo rechazado */}
        {deviceStatus === "REJECTED" && (
          <div className="mb-5 p-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto">
              <ShieldOff className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">Dispositivo rechazado</p>
            <p className="text-xs text-red-500/80 dark:text-red-400/70 leading-relaxed">
              Este dispositivo no tiene autorización para acceder al sistema.<br />
              Contacta a RRHH para más información.
            </p>
            <p className="text-xs text-gray-400 dark:text-white/30">soporte@baru.com</p>
            <button
              onClick={() => setDeviceStatus(null)}
              className="w-full py-2 rounded-xl border border-red-200 dark:border-red-500/30 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}

        {/* Bloqueo permanente */}
        {permanent && (
          <div className="mb-5 p-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-center space-y-3">
            <ShieldOff className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Cuenta bloqueada</p>
            <p className="text-xs text-red-500/80 dark:text-red-400/70">
              Tu cuenta fue bloqueada por múltiples intentos fallidos.
            </p>
            <button
              onClick={() => navigate("/recuperar")}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition shadow-md shadow-red-500/30"
            >
              Recuperar contraseña
            </button>
            <p className="text-xs text-gray-400 dark:text-white/30">
              O escribe a <span className="text-blue-400">soporte@baru.com</span>
            </p>
          </div>
        )}

        {/* Bloqueo temporal con countdown */}
        {!permanent && lockUntil && countdown > 0 && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Cuenta bloqueada</p>
              </div>
              <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
                {formatCountdown(countdown)}
              </span>
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/70">{error}</p>
          </div>
        )}

        {/* Error normal con intentos restantes */}
        {!permanent && !isLocked && error && (
          <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2.5 ${
            attemptsLeft === 1
              ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
              : "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30"
          }`}>
            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${attemptsLeft === 1 ? "text-red-500" : "text-orange-500"}`} />
            <p className={`text-sm ${attemptsLeft === 1 ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}>
              {error}
            </p>
          </div>
        )}

        {/* Indicador de intentos restantes */}
        {!isLocked && attemptsLeft !== null && (
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                i < attemptsLeft
                  ? attemptsLeft === 1 ? "bg-red-500" : "bg-orange-400"
                  : "bg-gray-200 dark:bg-white/10"
              }`} />
            ))}
            <span className={`text-xs ml-1 ${attemptsLeft === 1 ? "text-red-500" : "text-orange-400"}`}>
              {attemptsLeft} intento{attemptsLeft !== 1 ? "s" : ""} restante{attemptsLeft !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Inputs */}
        {!permanent && !deviceStatus && (
          <div onKeyDown={handleKey}>
            <Input
              label="Correo institucional"
              placeholder="usuario@empresa.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={isLocked}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLocked}
            />
          </div>
        )}

        {/* Olvidaste tu contraseña */}
        {!permanent && !deviceStatus && (
          <div className="text-right mb-4">
            <button
              onClick={() => navigate("/recuperar")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {/* Botón */}
        {!permanent && !deviceStatus && (
          <Button
            text={
              loading    ? "Ingresando..." :
              isLocked   ? `Bloqueado · ${formatCountdown(countdown)}` :
                           "Entrar"
            }
            onClick={handleLogin}
            disabled={loading || isLocked}
          />
        )}

      </div>
    </AuthLayout>
  );
}

export default Login;
