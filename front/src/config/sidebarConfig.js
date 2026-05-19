import {
  LayoutDashboard,
  CreditCard,
  Activity,
  Bell,
  Book,
  ClipboardList,
  TrendingUp,
  FileText,
  Users,
  Shield,
  Settings
} from "lucide-react";

const sidebarConfig = {
  "/dashboard": [
    { label: "Resumen", icon: LayoutDashboard },
    { label: "Cards", icon: CreditCard },
    { label: "Indicadores rápidos", icon: Activity },
    { label: "Avisos", icon: Bell },
  ],

  "/capacitacion": [
    { label: "Cursos", icon: Book },
    { label: "Evaluaciones", icon: ClipboardList },
    { label: "Progreso", icon: TrendingUp },
  ],

  "/comunicacion": [
    { label: "Avisos", icon: Bell },
    { label: "Documentos", icon: FileText },
    { label: "Videos RSE", icon: Activity },
  ],

  "/indicadores": [
    { label: "Gobernanza", icon: Shield },
    { label: "Clientes", icon: Users },
    { label: "Comunidad", icon: Users },
    { label: "Trabajadores", icon: Users },
    { label: "Medio ambiente", icon: Activity },
  ],

  "/reporte": [
    { label: "Reportes generales", icon: FileText },
    { label: "Exportar PDF / Excel", icon: FileText },
  ],

  "/usuario": [
    { label: "Lista de usuarios", icon: Users },
    { label: "Roles", icon: Shield },
    { label: "Permisos", icon: Settings },
  ],

  "/configuracion": [
    { label: "Seguridad", icon: Shield },
    { label: "Preferencias", icon: Settings },
    { label: "Datos empresa", icon: FileText },
  ],
};

export default sidebarConfig;