/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const T = {
  es: {
    nav_dashboard:    "Dashboard",
    nav_capacitacion: "Capacitación",
    nav_comunicacion: "Comunicación",
    nav_indicadores:  "Indicadores",
    nav_reporte:      "Reporte",
    nav_usuario:      "Usuario",
    nav_config:       "Configuración",
    nav_ayuda:        "Ayuda",
    notif_title:      "Notificaciones",
    notif_empty:      "Sin notificaciones nuevas",
    notif_viewAll:    "Ver todas",
    notif_disabled:   "Avisos desactivados en tus preferencias",
    assistant_online: "En línea",
    modal_close:      "Cerrar",
    dash_title:       "Dashboard",
    dash_sub:         "Resumen de tu actividad y métricas del sistema",
    cap_title:        "Capacitación",
    cap_sub:          "Cursos y formación del equipo",
    com_title:        "Comunicación",
    com_sub:          "Avisos, documentos y videos institucionales",
    ind_title:        "Indicadores RSE",
    ind_sub:          "Métricas de Responsabilidad Social Empresarial",
    rep_title:        "Reportes",
    rep_sub:          "Exporta y gestiona los datos del sistema",
    usr_title:        "Gestión de Usuarios",
    usr_sub:          "Administra colaboradores, roles y permisos del sistema",
    help_title:       "Centro de Ayuda",
    help_sub:         "Preguntas frecuentes y guías del sistema",
    cfg_title:        "Configuración",
    cfg_sub:          "Seguridad, preferencias y ajustes del sistema",
    logout:           "Cerrar sesión",
  },
  en: {
    nav_dashboard:    "Dashboard",
    nav_capacitacion: "Training",
    nav_comunicacion: "Communication",
    nav_indicadores:  "RSE Metrics",
    nav_reporte:      "Reports",
    nav_usuario:      "Users",
    nav_config:       "Settings",
    nav_ayuda:        "Help",
    notif_title:      "Notifications",
    notif_empty:      "No new notifications",
    notif_viewAll:    "View all",
    notif_disabled:   "Notices disabled in your preferences",
    assistant_online: "Online",
    modal_close:      "Close",
    dash_title:       "Dashboard",
    dash_sub:         "Your activity summary and system metrics",
    cap_title:        "Training",
    cap_sub:          "Team courses and professional development",
    com_title:        "Communication",
    com_sub:          "Notices, documents and institutional videos",
    ind_title:        "RSE Indicators",
    ind_sub:          "Corporate Social Responsibility metrics",
    rep_title:        "Reports",
    rep_sub:          "Export and manage system data",
    usr_title:        "User Management",
    usr_sub:          "Manage team members, roles and permissions",
    help_title:       "Help Center",
    help_sub:         "Frequently asked questions and system guides",
    cfg_title:        "Settings",
    cfg_sub:          "Security, preferences and system settings",
    logout:           "Sign out",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("baru_lang") || "es");

  const setLang = code => {
    setLangState(code);
    localStorage.setItem("baru_lang", code);
  };

  const t = key => T[lang]?.[key] ?? T.es[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
