import DashboardLayout from "../layouts/DashboardLayout";
import {
  HelpCircle, Book, MessageCircle, Video, Mail, ChevronDown, ChevronRight,
  CheckCircle, XCircle, Shield, Users, BookOpen, Bell, Settings,
  Send, Bot, Search, X, ThumbsUp, ThumbsDown, Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../config/roles";
import { useLanguage } from "../context/LanguageContext";
import { botReply } from "../config/botKB";

/* ─── Datos de rol ─────────────────────────────────────────────── */
const ROLE_ICON = {
  PROJECT_MANAGER: Shield,
  ADMIN_AREA:      Settings,
  RRHH:            Users,
  COMUNICACION:    Bell,
  COLABORADOR:     BookOpen,
};

const ROLE_GRADIENT = {
  PROJECT_MANAGER: "from-violet-500 to-violet-700",
  ADMIN_AREA:      "from-blue-500 to-blue-700",
  RRHH:            "from-green-500 to-green-700",
  COMUNICACION:    "from-amber-500 to-amber-700",
  COLABORADOR:     "from-gray-500 to-gray-700",
};

const ROLE_CAPABILITIES = {
  PROJECT_MANAGER: {
    puede: [
      "Gestionar y crear usuarios con cualquier rol",
      "Crear, editar y eliminar cursos de capacitación",
      "Publicar y eliminar avisos institucionales",
      "Subir y eliminar documentos",
      "Actualizar indicadores de Sostenibilidad",
      "Ver y exportar todos los reportes",
      "Acceder a Configuración del sistema",
    ],
    noTiene: [],
  },
  ADMIN_AREA: {
    puede: [
      "Crear y editar cursos de capacitación",
      "Publicar avisos institucionales",
      "Subir documentos",
      "Actualizar indicadores de Sostenibilidad",
      "Ver y exportar reportes",
      "Ver lista de usuarios",
    ],
    noTiene: [
      "Crear o eliminar usuarios",
      "Eliminar cursos o avisos",
      "Acceder a Configuración",
    ],
  },
  RRHH: {
    puede: [
      "Crear y gestionar usuarios",
      "Ver y exportar reportes",
      "Ver lista de usuarios con actividad",
    ],
    noTiene: [
      "Crear cursos o avisos",
      "Editar indicadores de Sostenibilidad",
      "Acceder a Configuración",
    ],
  },
  COMUNICACION: {
    puede: [
      "Publicar avisos institucionales",
      "Subir documentos",
      "Ver cursos, comunicados e indicadores",
    ],
    noTiene: [
      "Crear o gestionar usuarios",
      "Crear cursos de capacitación",
      "Editar indicadores de Sostenibilidad",
      "Ver reportes",
      "Acceder a Configuración",
    ],
  },
  COLABORADOR: {
    puede: [
      "Ver cursos asignados y registrar mi progreso",
      "Ver avisos y descargar documentos",
      "Consultar indicadores de Sostenibilidad",
    ],
    noTiene: [
      "Crear o modificar cualquier contenido",
      "Ver reportes o gestionar usuarios",
      "Acceder a Configuración",
    ],
  },
};

const PERMISOS_TABLA = [
  { accion: "Gestionar usuarios",      pm: true,  aa: false, rr: true,  co: false, cb: false },
  { accion: "Ver lista de usuarios",   pm: true,  aa: true,  rr: true,  co: false, cb: false },
  { accion: "Crear cursos",            pm: true,  aa: true,  rr: false, co: false, cb: false },
  { accion: "Eliminar cursos",         pm: true,  aa: false, rr: false, co: false, cb: false },
  { accion: "Publicar avisos",         pm: true,  aa: true,  rr: false, co: true,  cb: false },
  { accion: "Editar indicadores de Sostenibilidad",  pm: true,  aa: true,  rr: false, co: false, cb: false },
  { accion: "Ver y exportar reportes", pm: true,  aa: true,  rr: true,  co: false, cb: false },
  { accion: "Configuración",           pm: true,  aa: false, rr: false, co: false, cb: false },
];

const ROLES_ORDER = [
  { key: "PROJECT_MANAGER", colKey: "pm" },
  { key: "ADMIN_AREA",      colKey: "aa" },
  { key: "RRHH",            colKey: "rr" },
  { key: "COMUNICACION",    colKey: "co" },
  { key: "COLABORADOR",     colKey: "cb" },
];

/* ─── FAQs con categorías ──────────────────────────────────────── */
const FAQS = [
  { cat: "inicio",       pregunta: "¿Cómo cambio mi contraseña?",                    respuesta: "Ve a Configuración → Mi perfil → Cambiar contraseña. Si es tu primer acceso, el sistema te lo pedirá automáticamente al iniciar sesión." },
  { cat: "inicio",       pregunta: "¿Por qué no puedo ver ciertos módulos?",          respuesta: "El acceso depende de tu rol asignado. Consulta la sección 'Tu perfil en el sistema' arriba para ver exactamente qué módulos tienes disponibles. Si necesitas permisos adicionales, contacta a RRHH." },
  { cat: "inicio",       pregunta: "¿Cómo activo o desactivo las notificaciones?",    respuesta: "Ve a Configuración → Notificaciones. Puedes controlar qué tipos de avisos recibes y si aparecen en el topbar. Los cambios se aplican de inmediato." },
  { cat: "inicio",       pregunta: "¿Cómo cambio el idioma de la plataforma?",        respuesta: "Ve a Configuración → Idioma y región. Puedes elegir entre Español e Inglés. El cambio afecta todos los textos de navegación de la plataforma." },
  { cat: "inicio",       pregunta: "¿Cómo reporto un error o problema técnico?",      respuesta: "Escribe a soporte@baru.com con una descripción del problema y una captura de pantalla si es posible. Respondemos en menos de 24 horas hábiles." },
  { cat: "capacitacion", pregunta: "¿Cómo registro mi progreso en un curso?",         respuesta: "Entra a Capacitación, haz clic en la tarjeta del curso y en la parte inferior del detalle encontrarás los botones de progreso (0%, 25%, 50%, 75%, Completado). El progreso se guarda automáticamente." },
  { cat: "capacitacion", pregunta: "¿Cómo veo el video adjunto de un curso?",         respuesta: "Al abrir el detalle del curso, el video de YouTube o Vimeo se carga directamente en la parte superior del modal. Si no aparece video, el administrador aún no lo ha configurado." },
  { cat: "capacitacion", pregunta: "¿Cómo descargo el material de un curso?",         respuesta: "Al abrir el detalle del curso, si el administrador adjuntó un enlace de material, verás el botón 'Material del curso'. Haz clic para abrirlo en una nueva pestaña." },
  { cat: "capacitacion", pregunta: "¿Por qué no veo todos los cursos disponibles?",   respuesta: "Los cursos pueden estar asignados a roles específicos. Solo ves los cursos que el administrador asignó a tu perfil. Contacta a tu Admin de Área si crees que falta alguno." },
  { cat: "comunicacion", pregunta: "¿Cómo descargo un documento del área?",            respuesta: "En Comunicación → pestaña Documentos, haz clic en el botón de descarga junto al archivo que necesitas. El archivo se abre en una nueva pestaña para que puedas guardarlo." },
  { cat: "comunicacion", pregunta: "¿Qué son los avisos urgentes?",                    respuesta: "Los avisos marcados como urgentes aparecen con un punto rojo en la campana del topbar y se destacan visualmente al tope de la lista de avisos. Son comunicaciones de atención inmediata." },
  { cat: "indicadores",  pregunta: "¿Qué significan los colores en Indicadores?",      respuesta: "🟢 Óptimo = 70% o más · 🟡 En progreso = 40–69% · 🔴 En riesgo = menos del 40%. Presiona el ícono ℹ en cada eje para ver qué métricas lo componen y su detalle." },
  { cat: "indicadores",  pregunta: "¿Cada cuánto se actualizan los indicadores de Sostenibilidad?",  respuesta: "Los indicadores de Sostenibilidad se actualizan trimestralmente por el equipo de Project Management o Admin de Área. Verás la fecha de última actualización en el panel superior de la página." },
  { cat: "indicadores",  pregunta: "¿Qué son los 5 ejes de Sostenibilidad de Operadora Barú?",       respuesta: "Los 5 ejes de sostenibilidad son: Gobernanza (cumplimiento y ética), Clientes (NPS y satisfacción), Comunidad (proyectos sociales), Trabajadores (clima laboral) y Medio Ambiente (huella ecológica). Cada eje agrupa métricas específicas." },
];

const CATS = [
  { id: null,          label: "Todos" },
  { id: "inicio",      label: "Inicio" },
  { id: "capacitacion",label: "Capacitación" },
  { id: "comunicacion",label: "Comunicación" },
  { id: "indicadores", label: "Indicadores" },
];

/* ─── Temas frecuentes ─────────────────────────────────────────── */
const TEMAS = [
  { id: "inicio",       icon: Book,          titulo: "Guía de inicio",  desc: "Primeros pasos en la plataforma",   color: "from-blue-500 to-blue-700",   items: ["Cambiar contraseña", "Entender tu rol", "Activar notificaciones", "Cambiar idioma"] },
  { id: "capacitacion", icon: Video,         titulo: "Capacitación",    desc: "Cómo usar el módulo de cursos",     color: "from-violet-500 to-violet-700",items: ["Ver mis cursos asignados", "Ver video del curso", "Registrar mi progreso", "Descargar material"] },
  { id: "comunicacion", icon: MessageCircle, titulo: "Comunicación",    desc: "Avisos, documentos y videos",       color: "from-green-500 to-green-700",  items: ["Ver avisos institucionales", "Descargar documentos", "Avisos urgentes"] },
  { id: "indicadores",  icon: HelpCircle,    titulo: "Indicadores",     desc: "Módulo de Sostenibilidad",      color: "from-amber-500 to-amber-700",  items: ["Entender los 5 ejes", "Semáforo verde/amarillo/rojo", "Ver tendencia histórica"] },
];

/* ─── Quick replies para el chatbot ─────────────────────────────── */
const QUICK_REPLIES = [
  "¿Cómo cambio mi contraseña?",
  "¿Cómo registro mi avance en un curso?",
  "¿Qué significa el semáforo de indicadores?",
  "¿Cómo descargo un documento?",
];

/* ─── Chatbot ──────────────────────────────────────────────────── */
function Chatbot() {
  const { user } = useAuth();
  const msgKey     = `baru_chat_msgs_${user?.id || "guest"}`;
  const startedKey = `baru_chat_started_${user?.id || "guest"}`;

  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(msgKey)) || []; }
    catch { return []; }
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(() => !!localStorage.getItem(startedKey));
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(msgKey, JSON.stringify(messages));
  }, [messages, msgKey]);

  const send = (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;
    setInput("");
    setHasStarted(true);
    localStorage.setItem(startedKey, "1");
    setMessages(prev => [...prev, { from: "user", text: trimmed }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { from: "bot", text: botReply(trimmed) }]);
    }, 900);
  };

  const clearChat = () => {
    localStorage.removeItem(msgKey);
    localStorage.removeItem(startedKey);
    setMessages([]);
    setHasStarted(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col h-[22rem]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Asistente BARÚ</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              En línea
            </p>
          </div>
        </div>
        {hasStarted && (
          <button
            onClick={clearChat}
            title="Limpiar conversación"
            className="p-1.5 rounded-lg text-gray-400 dark:text-white/30 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Mensaje inicial */}
        <div className="flex justify-start">
          <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80">
            ¡Hola! Soy el asistente de BARÚ. ¿En qué te puedo ayudar hoy?
          </div>
        </div>

        {/* Sugerencias rápidas — desaparecen al iniciar conversación */}
        {!hasStarted && (
          <div className="flex flex-col gap-1.5 pl-1">
            {QUICK_REPLIES.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                className="text-left text-xs px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition flex items-center gap-1.5"
              >
                <ChevronRight className="w-3 h-3 shrink-0" />
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Conversación */}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.from === "user"
                ? "bg-blue-500 text-white rounded-br-sm"
                : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 rounded-bl-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-white/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe tu pregunta..."
          className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || typing}
          className="w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition shrink-0"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

/* ─── FAQ Item ─────────────────────────────────────────────────── */
function FAQItem({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false);
  const [vote, setVote] = useState(null);

  return (
    <div className="border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-white/80 pr-4">{pregunta}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-white/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-50 dark:border-white/5 pt-3">
          <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-3">{respuesta}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-white/30">¿Te ayudó?</span>
            <button
              onClick={() => setVote(vote === "up" ? null : "up")}
              className={`p-1 rounded-lg transition ${vote === "up" ? "text-green-500 bg-green-50 dark:bg-green-500/10" : "text-gray-300 dark:text-white/20 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10"}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setVote(vote === "down" ? null : "down")}
              className={`p-1 rounded-lg transition ${vote === "down" ? "text-red-400 bg-red-50 dark:bg-red-500/10" : "text-gray-300 dark:text-white/20 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"}`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            {vote && (
              <span className="text-xs text-gray-400 dark:text-white/30 ml-1">
                {vote === "up" ? "¡Gracias!" : "Lo tomaremos en cuenta"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Página principal ─────────────────────────────────────────── */
function Ayuda() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showRolesTable, setShowRolesTable] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const faqRef = useRef(null);

  const rol      = user?.role || "COLABORADOR";
  const caps     = ROLE_CAPABILITIES[rol] || ROLE_CAPABILITIES.COLABORADOR;
  const RolIcon  = ROLE_ICON[rol] || BookOpen;
  const rolGrad  = ROLE_GRADIENT[rol] || "from-gray-500 to-gray-700";
  const rolLabel = ROLE_LABELS[rol] || rol;

  const handleTemaClick = (temaId) => {
    setActiveCategory(prev => prev === temaId ? null : temaId);
    setSearchQ("");
    setTimeout(() => faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const faqsFiltrados = FAQS.filter(faq => {
    const matchCat = !activeCategory || faq.cat === activeCategory;
    const q = searchQ.toLowerCase();
    const matchSearch = !q || faq.pregunta.toLowerCase().includes(q) || faq.respuesta.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-7">

        {/* HERO */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 p-7 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-2 bottom-0 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">{t("help_title")}</h1>
            <p className="text-sm opacity-75">{t("help_sub")}</p>
          </div>
        </div>

        {/* TU PERFIL EN EL SISTEMA */}
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Tu perfil en el sistema</h2>
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">

            {/* Rol header */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100 dark:border-white/10">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${rolGrad} flex items-center justify-center shadow-lg shrink-0`}>
                <RolIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{rolLabel}</p>
                <p className="text-sm text-gray-400 dark:text-white/40">{user?.name || "Usuario"} · {user?.email || ""}</p>
              </div>
            </div>

            {/* Capacidades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Puedes hacer
                </p>
                <ul className="space-y-2">
                  {caps.puede.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-white/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {caps.noTiene.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" /> Sin acceso a
                  </p>
                  <ul className="space-y-2">
                    {caps.noTiene.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400 dark:text-white/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/20 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Tabla comparativa */}
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/10">
              <button
                onClick={() => setShowRolesTable(!showRolesTable)}
                className="flex items-center gap-2 text-sm text-blue-500 dark:text-blue-400 hover:underline transition"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showRolesTable ? "rotate-180" : ""}`} />
                {showRolesTable ? "Ocultar" : "Ver"} comparación de todos los roles
              </button>

              {showRolesTable && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left py-2 pr-4 text-gray-500 dark:text-white/40 font-semibold w-44">Capacidad</th>
                        {ROLES_ORDER.map(({ key }) => (
                          <th key={key} className="py-2 px-2 text-center text-gray-500 dark:text-white/40 font-semibold">
                            <span className={`inline-block px-2 py-0.5 rounded-full ${key === rol ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" : ""}`}>
                              {ROLE_LABELS[key]?.split(" ")[0]}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISOS_TABLA.map((row, i) => (
                        <tr key={i} className="border-t border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="py-2 pr-4 text-gray-600 dark:text-white/60">{row.accion}</td>
                          {ROLES_ORDER.map(({ key, colKey }) => (
                            <td key={key} className="py-2 px-2 text-center">
                              {row[colKey]
                                ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                : <XCircle className="w-4 h-4 text-gray-200 dark:text-white/10 mx-auto" />
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TEMAS FRECUENTES */}
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Temas frecuentes</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMAS.map((tema) => {
              const isActive = activeCategory === tema.id;
              return (
                <button
                  key={tema.id}
                  onClick={() => handleTemaClick(tema.id)}
                  className={`text-left bg-white dark:bg-white/5 rounded-2xl border transition cursor-pointer group hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/30 p-4 ${
                    isActive
                      ? "border-blue-400 dark:border-blue-500/60 ring-2 ring-blue-500/20"
                      : "border-gray-100 dark:border-white/10"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tema.color} flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                    <tema.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-sm text-gray-800 dark:text-white mb-1">{tema.titulo}</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mb-3">{tema.desc}</p>
                  <div className="space-y-1.5">
                    {tema.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
                        <ChevronRight className="w-3 h-3 shrink-0 text-gray-300 dark:text-white/20" />
                        {item}
                      </div>
                    ))}
                  </div>
                  {isActive && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 text-xs text-blue-500 dark:text-blue-400 font-medium">
                      Filtrando preguntas ↓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ + CHATBOT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={faqRef}>

          {/* FAQ — 2/3 */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-white">Preguntas frecuentes</h2>
              {/* Buscador */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Buscar pregunta..."
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQ && (
                  <button onClick={() => setSearchQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Chips de categoría */}
            <div className="flex flex-wrap gap-2 mb-4">
              {CATS.map(cat => (
                <button
                  key={String(cat.id)}
                  onClick={() => { setActiveCategory(cat.id); setSearchQ(""); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    activeCategory === cat.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/20"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              {(activeCategory !== null || searchQ) && (
                <button
                  onClick={() => { setActiveCategory(null); setSearchQ(""); }}
                  className="px-3 py-1 rounded-full text-xs font-medium text-red-400 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Limpiar
                </button>
              )}
            </div>

            {/* Contador */}
            <p className="text-xs text-gray-400 dark:text-white/30 mb-3">
              {faqsFiltrados.length} {faqsFiltrados.length === 1 ? "pregunta" : "preguntas"}
              {activeCategory ? ` en ${CATS.find(c => c.id === activeCategory)?.label}` : ""}
              {searchQ ? ` para "${searchQ}"` : ""}
            </p>

            {/* Lista */}
            {faqsFiltrados.length > 0 ? (
              <div className="space-y-2">
                {faqsFiltrados.map((faq, i) => <FAQItem key={i} pregunta={faq.pregunta} respuesta={faq.respuesta} />)}
              </div>
            ) : (
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-8 text-center">
                <Search className="w-8 h-8 text-gray-300 dark:text-white/20 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600 dark:text-white/60 mb-1">Sin resultados</p>
                <p className="text-xs text-gray-400 dark:text-white/30">Intenta con otras palabras o escríbenos al chatbot</p>
              </div>
            )}
          </div>

          {/* CHATBOT + CONTACTO — 1/3 */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-white">Asistente virtual</h2>
            <Chatbot />

            <h2 className="font-semibold text-gray-800 dark:text-white pt-2">¿Necesitas más ayuda?</h2>
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Soporte por email</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">soporte@baru.com</p>
                  <p className="text-xs text-gray-400 dark:text-white/40">Respuesta en menos de 24 hrs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Chat interno</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Disponible Lun–Vie</p>
                  <p className="text-xs text-gray-400 dark:text-white/40">8:00 am – 6:00 pm</p>
                </div>
              </div>
              <a
                href="mailto:soporte@baru.com?subject=Soporte%20Plataforma%20Bar%C3%BA"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition shadow-lg shadow-blue-500/30"
              >
                <Send className="w-4 h-4" />
                Enviar mensaje
              </a>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20 p-4">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">¿Olvidaste tu contraseña?</p>
              <p className="text-xs text-amber-700 dark:text-amber-300/70">Contacta a RRHH o escribe a soporte@baru.com para recibir una contraseña temporal de acceso.</p>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

export default Ayuda;
