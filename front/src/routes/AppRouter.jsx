import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

// AUTH
import Login from "../pages/Login";
import Recuperar from "../pages/Recuperar";

// APP
import Dashboard from "../pages/Dashboard";
import Capacitacion from "../pages/Capacitacion";
import Comunicacion from "../pages/Comunicacion";
import Indicadores from "../pages/Indicadores";
import Reporte from "../pages/Reporte";
import Usuario from "../pages/Usuario";
import Configuracion from "../pages/Configuracion";
import Ayuda from "../pages/Ayuda";
import CambiarPassword from "../pages/CambiarPassword";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PÚBLICO */}
        <Route path="/" element={<Login />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/cambiar-password" element={<ProtectedRoute><CambiarPassword /></ProtectedRoute>} />

        {/* PROTEGIDO — cualquier rol autenticado */}
        <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/capacitacion" element={<ProtectedRoute><Capacitacion /></ProtectedRoute>} />
        <Route path="/comunicacion" element={<ProtectedRoute><Comunicacion /></ProtectedRoute>} />
        <Route path="/indicadores"  element={<ProtectedRoute><Indicadores /></ProtectedRoute>} />
        <Route path="/ayuda"        element={<ProtectedRoute><Ayuda /></ProtectedRoute>} />

        {/* PROTEGIDO — solo roles con acceso a reportes */}
        <Route path="/reporte" element={
          <RoleRoute allowedRoles={["PROJECT_MANAGER", "ADMIN_AREA", "RRHH"]}>
            <Reporte />
          </RoleRoute>
        } />

        {/* PROTEGIDO — solo roles con acceso a usuarios */}
        <Route path="/usuario" element={
          <RoleRoute allowedRoles={["PROJECT_MANAGER", "ADMIN_AREA", "RRHH"]}>
            <Usuario />
          </RoleRoute>
        } />

        {/* PROTEGIDO — solo Project Manager */}
        <Route path="/configuracion" element={
          <RoleRoute allowedRoles={["PROJECT_MANAGER"]}>
            <Configuracion />
          </RoleRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
