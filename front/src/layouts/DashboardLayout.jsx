import { useState, useEffect, useRef } from "react";
import {
  Bell, Bot, Send,
  User,
  LayoutDashboard,
  Book,
  MessageCircle,
  BarChart,
  FileText,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";
import { botReply } from "../config/botKB";

import { useNavigate, useLocation } from "react-router-dom";
import sidebarConfig from "../config/sidebarConfig";
import { modalContent } from "../config/modalContent";
import Breadcrumbs from "../components/Breadcrumbs";
import ThemeToggle from "../components/ThemeToggle";
import logoBlanco from "../assets/Barublanco.png";
import logoNegro from "../assets/barunegro.png";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiGetNotices } from "../services/api";

// Renderiza cada modal como componente React (permite usar hooks dentro de modalContent)
function ModalRenderer({ name }) {
  const Component = modalContent[name];
  if (!Component) return (
    <div className="flex flex-col items-center justify-center h-40 text-white/40">
      <FileText className="w-10 h-10 mb-2" />
      <p className="text-sm">Contenido próximamente</p>
    </div>
  );
  return <Component />;
}

function DashboardLayout({ children }) {
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openChat, setOpenChat]     = useState(false);
  const [activeSub, setActiveSub]   = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [notices, setNotices]       = useState([]);

  const [chatMessages, setChatMessages] = useState([
    { from: "bot", text: "¡Hola! Soy el asistente de BARÚ. ¿En qué te puedo ayudar?" }
  ]);
  const [chatInput, setChatInput]   = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const chatBottomRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = "/" + location.pathname.split("/")[1];
  const subMenu = sidebarConfig[currentPath] || [];
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const notifPrefs = (() => {
    try { return JSON.parse(localStorage.getItem(`baru_notif_${user?.id}`)) || { avisos: true }; }
    catch { return { avisos: true }; }
  })();

  const [topbarEnabled, setTopbarEnabled] = useState(
    () => localStorage.getItem(`baru_topbar_${user?.id}`) !== "0"
  );

  useEffect(() => {
    const sync = () => setTopbarEnabled(localStorage.getItem(`baru_topbar_${user?.id}`) !== "0");
    window.addEventListener("baru-settings-changed", sync);
    return () => window.removeEventListener("baru-settings-changed", sync);
  }, [user?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatTyping]);

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text || chatTyping) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { from: "user", text }]);
    setChatTyping(true);
    setTimeout(() => {
      setChatTyping(false);
      setChatMessages(prev => [...prev, { from: "bot", text: botReply(text) }]);
    }, 900);
  };

  const userInitials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "U";

  // Cargar avisos reales para el panel de notificaciones
  useEffect(() => {
    apiGetNotices().then(setNotices).catch(() => {});
  }, []);

  // Filtrar sidebar según rol del usuario
  const canSeeUsers   = ["PROJECT_MANAGER", "ADMIN_AREA", "RRHH"].includes(user?.role);
  const canSeeReporte = ["PROJECT_MANAGER", "ADMIN_AREA", "RRHH"].includes(user?.role);
  const canSeeConfig  = user?.role === "PROJECT_MANAGER";

  const menu = [
    { name: t("nav_dashboard"),    icon: <LayoutDashboard />, path: "/dashboard",    visible: true },
    { name: t("nav_capacitacion"), icon: <Book />,            path: "/capacitacion", visible: true },
    { name: t("nav_comunicacion"), icon: <MessageCircle />,   path: "/comunicacion", visible: true },
    { name: t("nav_indicadores"),  icon: <BarChart />,        path: "/indicadores",  visible: true },
    { name: t("nav_reporte"),      icon: <FileText />,        path: "/reporte",      visible: canSeeReporte },
    { name: t("nav_usuario"),      icon: <User />,            path: "/usuario",      visible: canSeeUsers },
  ].filter((item) => item.visible);

  const TYPE_ICON = {
    urgente: "🔴",
    warning: "🟡",
    info:    "🔵",
  };

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-[#0B0F1A]">

      {/* SIDEBAR */}
      <aside className="
        group flex flex-col justify-between
        w-20 hover:w-64
        transition-all duration-300
        backdrop-blur-xl
        bg-white/70 dark:bg-white/5
        border-r border-white/20
        text-gray-800 dark:text-gray-200
        p-3
      ">
        {/* TOP */}
        <div>
          <div className="flex justify-center mb-10">
            <img src={logoNegro}  className="w-10 group-hover:w-28 transition-all duration-300 block dark:hidden" />
            <img src={logoBlanco} className="w-10 group-hover:w-28 transition-all duration-300 hidden dark:block" />
          </div>

          <nav className="space-y-2">
            {menu.filter(item => item.name !== "Configuración").map((item) => (
              <SidebarItem
                key={item.name}
                icon={item.icon}
                text={item.name}
                active={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
          </nav>
        </div>

        {/* BOTTOM */}
        <div className="space-y-3">
          {canSeeConfig && (
            <SidebarItem
              icon={<Settings />}
              text={t("nav_config")}
              active={location.pathname === "/configuracion"}
              onClick={() => navigate("/configuracion")}
            />
          )}

          <SidebarItem
            icon={<HelpCircle />}
            text={t("nav_ayuda")}
            active={location.pathname === "/ayuda"}
            onClick={() => navigate("/ayuda")}
          />

          <div className="h-px w-full my-4 bg-gradient-to-r from-transparent via-gray-400/50 to-transparent dark:via-white/30" />

          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/40 dark:bg-white/10">
            <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {userInitials}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition text-sm min-w-0 flex-1">
              <p className="font-medium truncate">{user?.name || "Usuario"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || ""}</p>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="opacity-0 group-hover:opacity-100 transition shrink-0 p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOP BAR */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center px-6 py-4 gap-x-11 border-b border-gray-200 dark:border-gray-700">

          {/* IZQUIERDA → SUBMENU */}
          <div className="flex gap-3 overflow-hidden min-w-0">
            {topbarEnabled && subMenu.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    setActiveSub(index);
                    setModalTitle(item.label);
                    setModalOpen(true);
                  }}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-full
                    transition-all duration-300 border focus:outline-none focus:ring-0
                    ${activeSub === index
                      ? "bg-blue-500 text-white border-blue-500 shadow-lg scale-105"
                      : "bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white border-black/30 dark:border-white/20 hover:bg-blue-500 hover:text-white hover:shadow-md hover:scale-105"
                    }
                  `}
                >
                  <div className={`
                    w-7 h-7 flex items-center justify-center rounded-full transition-all
                    ${activeSub === index ? "bg-white text-blue-500" : "bg-white dark:bg-white/20 text-black dark:text-white"}
                  `}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                  {item.label === "Avisos" && notices.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 🔔 NOTIFICACIONES + 🤖 ASISTENTE */}
          <div className="flex items-center gap-2 shrink-0">

            {/* CAMPANA */}
            <div className="relative">
              <button
                onClick={() => { setOpenNotifications(!openNotifications); setOpenChat(false); }}
                className="relative p-2 rounded-full transition-all duration-300 bg-gray-200 dark:bg-white/10 hover:bg-gray-200/70 dark:hover:bg-gray-800/70 hover:shadow-md hover:scale-105 active:scale-95"
              >
                <Bell className="w-5 h-5 text-black dark:text-white" />
                {notifPrefs.avisos && notices.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {openNotifications && (
                <div className="absolute right-0 top-12 w-80 rounded-xl overflow-hidden bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 shadow-xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">{t("notif_title")}</p>
                    <button onClick={() => setOpenNotifications(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition">✕</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {!notifPrefs.avisos ? (
                      <div className="px-4 py-8 text-center text-gray-400 dark:text-white/30 text-sm space-y-1">
                        <p>🔕</p>
                        <p>{t("notif_disabled")}</p>
                      </div>
                    ) : notices.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-400 dark:text-white/30 text-sm">{t("notif_empty")}</div>
                    ) : (
                      notices.slice(0, 5).map((n, i) => (
                        <div key={i} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                          <p className="text-sm text-gray-800 dark:text-white">{TYPE_ICON[n.type] || "🔵"} {n.title}</p>
                          <span className="text-xs text-gray-500 dark:text-white/40">
                            {new Date(n.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
                    <button onClick={() => { navigate("/comunicacion"); setOpenNotifications(false); }} className="text-sm text-blue-500 hover:underline">
                      {t("notif_viewAll")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ASISTENTE */}
            <div className="relative">
              <button
                onClick={() => { setOpenChat(!openChat); setOpenNotifications(false); }}
                className="relative p-2 rounded-full transition-all duration-300 bg-gray-200 dark:bg-white/10 hover:bg-gray-200/70 dark:hover:bg-gray-800/70 hover:shadow-md hover:scale-105 active:scale-95"
                title="Asistente BARÚ"
              >
                <Bot className="w-5 h-5 text-black dark:text-white" />
              </button>

              {openChat && (
                <div className="absolute right-0 top-12 w-80 h-[420px] rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white leading-none">Asistente BARÚ</p>
                        <p className="text-xs text-green-500 mt-0.5">{t("assistant_online")}</p>
                      </div>
                    </div>
                    <button onClick={() => setOpenChat(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition text-lg leading-none">✕</button>
                  </div>

                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          m.from === "user"
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 rounded-bl-sm"
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {chatTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-white/10 px-3.5 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                          {[0,1,2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-white/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input */}
                  <div className="px-3 pb-3 pt-2 flex gap-2 border-t border-gray-100 dark:border-white/10 shrink-0">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                      placeholder="Escribe tu pregunta..."
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendChat}
                      disabled={!chatInput.trim() || chatTyping}
                      className="w-8 h-8 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 🌗 TOGGLE */}
          <div className="flex justify-end shrink-0">
            <ThemeToggle />
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1 p-6 text-gray-900 dark:text-white dark:bg-[#0B0F1A] overflow-auto">
          <Breadcrumbs />
          {children}
        </main>

        {/* MODAL ACCESO RÁPIDO */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setModalOpen(false)} />
            <div className="
              relative z-10 w-full max-w-2xl max-h-[85vh]
              rounded-2xl overflow-hidden flex flex-col
              bg-[#0d1117]/90 dark:bg-[#0d1117]/95
              backdrop-blur-2xl border border-white/15
              shadow-[0_24px_64px_rgba(0,0,0,0.5)] text-white
            ">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                <div>
                  <h2 className="text-base font-semibold">{modalTitle}</h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    Grupo BARÚ · {new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                <ModalRenderer name={modalTitle} />
              </div>

              <div className="px-6 py-3 border-t border-white/10 flex justify-end shrink-0">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-sm font-medium shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  {t("modal_close")}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default DashboardLayout;

function SidebarItem({ icon, text, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-2 rounded-lg cursor-pointer transition
        ${active ? "bg-blue-500 text-white shadow-md" : "hover:bg-white/30 dark:hover:bg-white/10"}
      `}
    >
      <div className="text-xl">{icon}</div>
      <span className="opacity-0 group-hover:opacity-100 transition whitespace-nowrap">{text}</span>
    </div>
  );
}
