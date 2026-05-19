import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiChangePassword } from "../services/api";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/Input";
import Button from "../components/Button";
import { KeyRound } from "lucide-react";

function CambiarPassword() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newPassword || !confirm) {
      setError("Completa todos los campos");
      return;
    }
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setError("");
    setLoading(true);
    try {
      // currentPassword vacío porque el backend acepta el cambio con token válido en primer login
      await apiChangePassword("", newPassword);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.error || "Error al actualizar la contraseña";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-96 p-8 pt-10 rounded-2xl bg-white dark:bg-[#111827] shadow-2xl border border-gray-200 dark:border-gray-700">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
              <KeyRound className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Cambia tu contraseña
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Es tu primer acceso — elige una contraseña segura
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <Input
          label="Nueva contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="Repite la contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <Button
          text={loading ? "Guardando..." : "Guardar contraseña"}
          onClick={handleSubmit}
          disabled={loading}
        />

        <button
          onClick={logout}
          className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition"
        >
          Salir
        </button>
      </div>
    </AuthLayout>
  );
}

export default CambiarPassword;
