import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../config/roles";
import { apiGetCourses, apiGetMyProgress, apiGetLatestIndicadores, apiGetNotices } from "../services/api";
import {
  BookOpen, Bell, TrendingUp,
  CheckCircle, AlertCircle, Star,
  ArrowUpRight, ArrowDownRight, ChevronRight, ChevronLeft, X
} from "lucide-react";

const EJE_STYLE = {
  "Gobernanza":     { color: "bg-blue-500",   stroke: "stroke-blue-500",   text: "text-blue-500" },
  "Clientes":       { color: "bg-amber-500",  stroke: "stroke-amber-500",  text: "text-amber-500" },
  "Comunidad":      { color: "bg-green-500",  stroke: "stroke-green-500",  text: "text-green-500" },
  "Trabajadores":   { color: "bg-violet-500", stroke: "stroke-violet-500", text: "text-violet-500" },
  "Medio ambiente": { color: "bg-teal-500",   stroke: "stroke-teal-500",   text: "text-teal-500" },
};

const COURSE_COLORS = [
  "from-blue-500 to-blue-700",
  "from-amber-500 to-amber-700",
  "from-violet-500 to-violet-700",
  "from-green-500 to-green-700",
  "from-rose-500 to-rose-700",
];

const WELCOME_SLIDES = [
  {
    gradient: "from-blue-500 to-violet-600",
    emoji: "👋",
    title: "¡Bienvenido a Operadora Barú!",
    desc: "Tu plataforma de gestión RSE. Aquí puedes capacitarte, mantenerte informado y consultar los indicadores de sostenibilidad de la empresa.",
  },
  {
    gradient: "from-violet-500 to-violet-700",
    emoji: "📚",
    title: "Capacitación",
    desc: "Accede a tus cursos asignados, ve el video y el material de apoyo. Registra tu progreso directamente en el curso. Los cursos obligatorios requieren completarse al 100%.",
  },
  {
    gradient: "from-green-500 to-teal-600",
    emoji: "📢",
    title: "Comunicación",
    desc: "Revisa los avisos institucionales más recientes, descarga documentos importantes de la empresa y consulta los videos RSE.",
  },
  {
    gradient: "from-amber-500 to-amber-700",
    emoji: "📊",
    title: "Indicadores RSE",
    desc: "Consulta los 5 ejes de sostenibilidad: Gobernanza, Clientes, Comunidad, Trabajadores y Medio Ambiente. Se actualizan trimestralmente.",
  },
];

function WelcomeModal({ onClose }) {
  const [step, setStep] = useState(0);
  const slide = WELCOME_SLIDES[step];
  const isLast = step === WELCOME_SLIDES.length - 1;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">

        {/* HEADER */}
        <div className={`bg-gradient-to-br ${slide.gradient} p-8 text-center relative overflow-hidden`}>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -left-4 bottom-0 w-20 h-20 bg-white/10 rounded-full" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10">
            <div className="text-5xl mb-4">{slide.emoji}</div>
            <h2 className="text-xl font-bold text-white">{slide.title}</h2>
          </div>
        </div>

        {/* BODY */}
        <div className="bg-white dark:bg-[#111827] p-6">
          <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed text-center mb-6">
            {slide.desc}
          </p>

          {/* DOTS */}
          <div className="flex justify-center gap-2 mb-6">
            {WELCOME_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-blue-500" : "w-2 bg-gray-200 dark:bg-white/20"}`}
              />
            ))}
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
            )}
            <button
              onClick={isLast ? onClose : () => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition"
            >
              {isLast ? "¡Comenzar!" : (<>Siguiente <ChevronRight className="w-4 h-4" /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, icon: StatIcon, gradient, delta, deltaUp }) => {
  const Icon = StatIcon;
  return (
  <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} text-white relative overflow-hidden`}>
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
    <div className="absolute -right-2 -bottom-6 w-16 h-16 bg-white/10 rounded-full" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        {delta && (
          <span className="flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full bg-white/20">
            {deltaUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-sm opacity-75 mt-1">{label}</p>
    </div>
  </div>
  );
};

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cursos, setCursos]         = useState([]);
  const [progreso, setProgreso]     = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [avisos, setAvisos]         = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [welcomeClosed, setWelcomeClosed] = useState(false);

  const hora      = new Date().getHours();
  const saludo    = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const firstName = user?.name?.split(" ")[0] || "Usuario";

  useEffect(() => {
    Promise.all([
      apiGetCourses().catch(() => []),
      apiGetMyProgress().catch(() => []),
      apiGetLatestIndicadores().catch(() => []),
      apiGetNotices().catch(() => []),
    ]).then(([c, p, ind, av]) => {
      setCursos(c);
      setProgreso(p);
      setIndicadores(ind);
      setAvisos(av);
    }).finally(() => setLoadingData(false));
  }, []);

  const showWelcome = !welcomeClosed && !!user?.id && !localStorage.getItem(`baru_welcome_${user.id}`);

  const closeWelcome = () => {
    if (user?.id) localStorage.setItem(`baru_welcome_${user.id}`, "1");
    setWelcomeClosed(true);
  };

  const cursosVisibles = cursos.filter(c => {
    const noRestriction = !c.targetRoles?.length && !c.targetEmails?.length;
    const byRole  = c.targetRoles?.includes(user?.role);
    const byEmail = c.targetEmails?.includes(user?.email?.toLowerCase());
    return noRestriction || byRole || byEmail;
  });

  const cursosConProgreso = cursosVisibles.slice(0, 3).map((c, i) => ({
    ...c,
    pct: progreso.find((p) => p.courseId === c.id)?.progress ?? 0,
    color: COURSE_COLORS[i % COURSE_COLORS.length],
  }));

  const completados = progreso.filter((p) => p.progress === 100).length;

  const stats = [
    { label: "Cursos disponibles", value: cursosVisibles.length || "—",  icon: BookOpen,   gradient: "from-violet-500 to-violet-700", delta: completados ? `${completados} completado${completados !== 1 ? "s" : ""}` : null, deltaUp: true },
    { label: "Avisos activos",     value: avisos.filter(a => a.active !== false).length || "—", icon: Bell, gradient: "from-amber-500 to-amber-700", delta: avisos.length ? `${avisos.length} en total` : null, deltaUp: true },
    { label: "Indicadores RSE",    value: indicadores.length || "—",     icon: TrendingUp, gradient: "from-blue-500 to-blue-700",   delta: indicadores[0]?.period || null, deltaUp: true },
    { label: "Cursos completados", value: completados || "—",            icon: Star,       gradient: "from-emerald-500 to-emerald-700", delta: cursosVisibles.length ? `de ${cursosVisibles.length} disponibles` : null, deltaUp: true },
  ];

  // Actividad derivada de datos reales
  const actividadItems = [];
  actividadItems.push({ icon: CheckCircle, text: "Sistema listo — datos cargados correctamente", time: "Ahora", color: "text-green-500 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10" });
  if (avisos.length > 0) {
    actividadItems.push({ icon: Bell, text: `Aviso: "${avisos[0].title}"`, time: new Date(avisos[0].createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" }), color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" });
  }
  const pendingMandatory = cursosVisibles.filter(c => c.mandatory && (progreso.find(p => p.courseId === c.id)?.progress ?? 0) < 100);
  if (pendingMandatory.length > 0) {
    actividadItems.push({ icon: AlertCircle, text: `${pendingMandatory.length} curso${pendingMandatory.length > 1 ? "s" : ""} obligatorio${pendingMandatory.length > 1 ? "s" : ""} sin completar`, time: "Pendiente", color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" });
  }
  if (completados > 0) {
    const lastCompleted = cursosVisibles.find(c => progreso.find(p => p.courseId === c.id && p.progress === 100));
    if (lastCompleted) actividadItems.push({ icon: Star, text: `Completaste: "${lastCompleted.title}"`, time: "Reciente", color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" });
  }
  if (indicadores.length > 0) {
    actividadItems.push({ icon: TrendingUp, text: `Indicadores RSE — periodo ${indicadores[0].period}`, time: indicadores[0].period, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" });
  }
  const actividad = actividadItems.slice(0, 4);

  return (
    <DashboardLayout>
      {showWelcome && <WelcomeModal onClose={closeWelcome} />}

      <div className="space-y-7">

        {/* BIENVENIDA */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {saludo}, {firstName}
            </h1>
            <p className="text-sm text-gray-400 dark:text-white/40 mt-1">
              {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 font-medium">
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* DOS COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* MIS CURSOS */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-white">Mis cursos</h2>
              <button onClick={() => navigate("/capacitacion")} className="text-xs text-blue-500 dark:text-blue-400 hover:underline">Ver todos</button>
            </div>
            {loadingData ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
              </div>
            ) : cursosConProgreso.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-white/40 text-center py-8">Sin cursos disponibles</p>
            ) : (
              <div className="space-y-3">
                {cursosConProgreso.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:shadow-md transition cursor-pointer group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition`}>
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{c.title}</p>
                        <span className="text-xs text-gray-400 dark:text-white/40 ml-2 shrink-0">{c.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mb-1.5">
                        <div className={`h-1.5 rounded-full bg-gradient-to-r ${c.color}`} style={{ width: `${c.pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-white/40">{c.instructor}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIVIDAD RECIENTE */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
            <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Actividad reciente</h2>
            <div className="space-y-1">
              {actividad.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.bg}`}>
                    <a.icon className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-white/80">{a.text}</p>
                    <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* INDICADORES RESUMEN */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white">Indicadores de sostenibilidad</h2>
            {indicadores[0]?.period && <span className="text-xs text-gray-400 dark:text-white/40">{indicadores[0].period}</span>}
          </div>
          {loadingData ? (
            <div className="flex gap-4">
              {[1,2,3,4,5].map(i => <div key={i} className="flex-1 h-20 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
            </div>
          ) : indicadores.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-white/30">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin datos de indicadores aún</p>
              <p className="text-xs mt-1 opacity-70">Los indicadores se registran desde la página Indicadores RSE</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {indicadores.map((ind, i) => {
                const style = EJE_STYLE[ind.category] || EJE_STYLE["Gobernanza"];
                const pct = Math.round(ind.value);
                return (
                  <div key={i} className="text-center">
                    <div className="relative w-14 h-14 mx-auto mb-2">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" className="text-gray-100 dark:text-white/10" strokeWidth="5" />
                        <circle cx="28" cy="28" r="22" fill="none" strokeWidth="5"
                          strokeLinecap="round"
                          className={style.stroke}
                          strokeDasharray={`${2 * Math.PI * 22 * pct / 100} ${2 * Math.PI * 22}`}
                        />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${style.text}`}>{pct}%</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-white/50 leading-tight">{ind.category}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
