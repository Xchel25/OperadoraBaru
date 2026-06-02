import { useState } from "react";
import Input from "../components/Input";
import AuthLayout from "../layouts/AuthLayout";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

function Recuperar() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [usuario, setUsuario] = useState("");
  const [error, setError] = useState("");

  const handleRecuperar = () => {
    if (!correo || !usuario) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (!correo.includes("@")) {
      setError("Correo no válido");
      return;
    }

    setError("");

    // simulación
    alert("Se enviaron instrucciones de recuperación");
    navigate("/");
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm p-6 pt-8 sm:p-8 sm:pt-10 rounded-2xl
        bg-white dark:bg-[#111827]
        shadow-2xl border border-gray-200 dark:border-gray-700">

        {/* Header */}
        <div className="text-center mb-8">

          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 flex items-center justify-center 
              rounded-full 
              bg-gray-200 dark:bg-gray-800 
              shadow-inner">
              <User className="w-6 h-6 text-gray-700 dark:text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Recuperar contraseña
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ingresa tus datos para continuar
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        {/* Inputs */}
        <Input
          label="Correo institucional"
          placeholder="usuario@empresa.com"
          onChange={(e) => setCorreo(e.target.value)}
        />

        <Input
          label="Usuario"
          placeholder="Tu usuario"
          onChange={(e) => setUsuario(e.target.value)}
        />

        {/* Botón */}
        <Button text="Recuperar contraseña" onClick={handleRecuperar} />

        {/* Volver */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Volver al login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Recuperar;