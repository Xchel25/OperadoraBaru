import { useLocation } from "react-router-dom";

const routes = {
  dashboard: "Dashboard",
  capacitacion: "Capacitación",
  comunicacion: "Comunicación",
  indicadores: "Indicadores",
  reporte: "Reporte",
  usuario: "Usuario",
  configuracion: "Configuración",
  ayuda: "Ayuda"
};

function Breadcrumbs() {
  const location = useLocation();

  const path = location.pathname.split("/").filter(Boolean);

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Inicio {path.map((p, i) => (
        <span key={i}> / {routes[p]}</span>
      ))}
    </div>
  );
}

export default Breadcrumbs;