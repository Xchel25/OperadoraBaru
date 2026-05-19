/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from "react";
import {
  Users, BookOpen, TrendingUp, Bell, FileText, Video,
  Shield, Star, Heart, Leaf, Download,
  CheckCircle, Clock, AlertCircle, Globe,
  Building, Settings, Loader2
} from "lucide-react";
import {
  apiGetUsers, apiGetCourses, apiGetMyProgress,
  apiGetNotices, apiGetDocuments, apiGetLatestIndicadores,
  apiGetReportes, apiCreateReporte,
} from "../services/api";
import { ROLE_LABELS } from "./roles";

// ─── Helpers internos ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="w-6 h-6 animate-spin text-white/40" />
    </div>
  );
}

function EmptyState({ icon: IconEl = FileText, text = "Sin datos disponibles" }) {
  const Icon = IconEl;
  return (
    <div className="flex flex-col items-center justify-center h-32 text-white/30">
      <Icon className="w-10 h-10 mb-2" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function ProximamenteBanner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-white/40 border border-dashed border-white/20 rounded-xl">
      <Settings className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm">{label || "Módulo en desarrollo"}</p>
      <p className="text-xs opacity-60 mt-1">Disponible próximamente</p>
    </div>
  );
}

const StatCard = ({ label, value, icon: IconEl, from, to, sub }) => {
  const Icon = IconEl;
  return (
  <div className={`rounded-xl p-4 bg-gradient-to-br ${from} ${to} text-white`}>
    <div className="flex items-center justify-between mb-2">
      <Icon className="w-5 h-5 opacity-80" />
      {sub && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{sub}</span>}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs opacity-70 mt-1">{label}</p>
  </div>
  );
};

const Badge = ({ text, color }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${color}`}>{text}</span>
);

const ProgressBar = ({ pct, color }) => (
  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
    <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
  </div>
);

const TYPE_STYLE = {
  urgente: { bg: "bg-red-500/20 text-red-400",   icon: AlertCircle, label: "Urgente",  badge: "bg-red-500/30 text-red-300" },
  warning: { bg: "bg-amber-500/20 text-amber-400",icon: Bell,        label: "Atención", badge: "bg-amber-500/30 text-amber-300" },
  info:    { bg: "bg-blue-500/20 text-blue-400",  icon: Bell,        label: "Info",     badge: "bg-blue-500/30 text-blue-300" },
};

const COURSE_COLORS = [
  "from-blue-500 to-blue-700",
  "from-amber-500 to-amber-700",
  "from-violet-500 to-violet-700",
  "from-green-500 to-green-700",
  "from-rose-500 to-rose-700",
  "from-gray-500 to-gray-700",
];

const ROL_COLOR = {
  PROJECT_MANAGER: "bg-red-500/20 text-red-300",
  ADMIN_AREA:      "bg-blue-500/20 text-blue-300",
  RRHH:            "bg-violet-500/20 text-violet-300",
  COMUNICACION:    "bg-amber-500/20 text-amber-300",
  COLABORADOR:     "bg-green-500/20 text-green-300",
};

const ROL_GRADIENT = {
  PROJECT_MANAGER: "from-red-500 to-rose-600",
  ADMIN_AREA:      "from-blue-500 to-blue-600",
  RRHH:            "from-violet-500 to-violet-600",
  COMUNICACION:    "from-amber-500 to-amber-600",
  COLABORADOR:     "from-green-500 to-green-600",
};

// ─── Contenido por sub-item ───────────────────────────────────────────────────

export const modalContent = {

  // ══════════════════════════════════════════════════
  //  DASHBOARD
  // ══════════════════════════════════════════════════

  "Resumen": function ResumenModal() {
    const [users, setUsers]         = useState([]);
    const [cursos, setCursos]       = useState([]);
    const [avisos, setAvisos]       = useState([]);
    const [inds, setInds]           = useState([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
      Promise.all([
        apiGetUsers().catch(() => []),
        apiGetCourses().catch(() => []),
        apiGetNotices().catch(() => []),
        apiGetLatestIndicadores().catch(() => []),
      ]).then(([u, c, a, i]) => { setUsers(u); setCursos(c); setAvisos(a); setInds(i); })
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;
    const activos = users.filter(u => u.active).length;
    const globalPct = inds.length
      ? Math.round(inds.reduce((acc, i) => acc + i.value, 0) / inds.length)
      : 0;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Colaboradores activos"  value={activos}         icon={Users}     from="from-blue-500"    to="to-blue-700" />
          <StatCard label="Cursos disponibles"     value={cursos.length}   icon={BookOpen}  from="from-violet-500"  to="to-violet-700" />
          <StatCard label="Avisos publicados"      value={avisos.length}   icon={Bell}      from="from-amber-500"   to="to-amber-700" sub="activos" />
          <StatCard label="Índice RSE global"      value={`${globalPct}%`} icon={TrendingUp} from="from-emerald-500" to="to-emerald-700" />
        </div>
        {inds.length > 0 && (
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm font-semibold mb-3 text-white/80">Indicadores RSE</p>
            {inds.map((ind, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-white/70">{ind.category}</span>
                  <span className="text-sm font-semibold">{Math.round(ind.value)}%</span>
                </div>
                <ProgressBar pct={Math.round(ind.value)} color="bg-blue-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },

  "Cards": function CardsModal() {
    const [inds, setInds]     = useState([]);
    const [users, setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      Promise.all([
        apiGetLatestIndicadores().catch(() => []),
        apiGetUsers().catch(() => []),
      ]).then(([i, u]) => { setInds(i); setUsers(u); })
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;

    const nps    = inds.find(i => i.category === "Clientes")?.value ?? "—";
    const activos = users.filter(u => u.active).length;

    return (
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Colaboradores activos"  value={activos}           icon={Users}    from="from-blue-500"   to="to-cyan-600" />
        <StatCard label="NPS Clientes"           value={Math.round(nps)}   icon={Star}     from="from-amber-500"  to="to-orange-600" />
        <StatCard label="Indicadores RSE"        value={`${inds.length}/5`} icon={TrendingUp} from="from-emerald-500" to="to-emerald-700" />
        <StatCard label="Avisos activos"         value="—"                 icon={Bell}     from="from-violet-500" to="to-violet-700" sub="ver Avisos" />
        {inds.map((ind, i) => (
          <StatCard
            key={i}
            label={ind.category}
            value={`${Math.round(ind.value)}%`}
            icon={TrendingUp}
            from={["from-blue-500","from-amber-500","from-green-500","from-violet-500","from-teal-500"][i] || "from-gray-500"}
            to={["to-blue-700","to-amber-700","to-green-700","to-violet-700","to-teal-700"][i] || "to-gray-700"}
            sub={ind.period}
          />
        ))}
      </div>
    );
  },

  "Indicadores rápidos": function IndicadoresRapidosModal() {
    const [inds, setInds]       = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      apiGetLatestIndicadores().then(setInds).catch(() => {}).finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;
    if (inds.length === 0) return <EmptyState icon={TrendingUp} text="Sin indicadores registrados" />;

    const COLORS = ["bg-blue-500", "bg-amber-500", "bg-green-500", "bg-violet-500", "bg-teal-500"];

    return (
      <div className="space-y-3">
        {inds.map((ind, i) => (
          <div key={i} className="bg-white/10 rounded-xl p-4 border border-white/10">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">{ind.category}</span>
              <span className="text-sm font-bold">{Math.round(ind.value)}%</span>
            </div>
            <ProgressBar pct={Math.round(ind.value)} color={COLORS[i % COLORS.length]} />
            <p className="text-xs text-white/40 mt-2">{ind.label} · {ind.period}</p>
          </div>
        ))}
      </div>
    );
  },

  "Avisos": function AvisosModal() {
    const [avisos, setAvisos]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      apiGetNotices().then(setAvisos).catch(() => {}).finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;
    if (avisos.length === 0) return <EmptyState icon={Bell} text="Sin avisos publicados" />;

    return (
      <div className="space-y-2">
        {avisos.map((a, i) => {
          const style = TYPE_STYLE[a.type] || TYPE_STYLE.info;
          const Icon  = style.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition cursor-pointer">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-white/50">
                  {new Date(a.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <Badge text={style.label} color={style.badge} />
            </div>
          );
        })}
      </div>
    );
  },

  // ══════════════════════════════════════════════════
  //  CAPACITACIÓN
  // ══════════════════════════════════════════════════

  "Cursos": function CursosModal() {
    const [cursos, setCursos]     = useState([]);
    const [progreso, setProgreso] = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
      Promise.all([apiGetCourses().catch(() => []), apiGetMyProgress().catch(() => [])])
        .then(([c, p]) => { setCursos(c); setProgreso(p); })
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;
    if (cursos.length === 0) return <EmptyState icon={BookOpen} text="Sin cursos registrados aún" />;

    return (
      <div className="space-y-3">
        {cursos.map((c, i) => {
          const pct   = progreso.find(p => p.courseId === c.id)?.progress ?? 0;
          const color = COURSE_COLORS[i % COURSE_COLORS.length];
          const cat   = pct === 100 ? "Completado" : c.mandatory ? "Obligatorio" : "Opcional";
          return (
            <div key={i} className="flex items-center gap-4 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition cursor-pointer">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{c.title}</p>
                  <span className="text-xs text-white/60 ml-2">{pct}%</span>
                </div>
                <ProgressBar pct={pct} color={color.split(" ")[0].replace("from-", "bg-")} />
                <p className="text-xs text-white/50 mt-1">{c.instructor}</p>
              </div>
              <Badge text={cat} color={pct === 100 ? "bg-green-500/30 text-green-300" : "bg-white/20 text-white/70"} />
            </div>
          );
        })}
      </div>
    );
  },

  "Evaluaciones": function EvaluacionesModal() {
    return <ProximamenteBanner label="Módulo de evaluaciones en desarrollo" />;
  },

  "Progreso": function ProgresoModal() {
    return <ProximamenteBanner label="Progreso por área en desarrollo" />;
  },

  // ══════════════════════════════════════════════════
  //  COMUNICACIÓN
  // ══════════════════════════════════════════════════

  "Documentos": function DocumentosModal() {
    const [docs, setDocs]         = useState([]);
    const [loading, setLoading]   = useState(true);
    const base = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

    useEffect(() => {
      apiGetDocuments().then(setDocs).catch(() => {}).finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;
    if (docs.length === 0) return <EmptyState icon={FileText} text="Sin documentos cargados aún" />;

    return (
      <div className="space-y-2">
        {docs.map((d, i) => {
          const ext = (d.url?.split(".").pop() || "DOC").toUpperCase().slice(0, 4);
          const colorMap = { PDF: "bg-red-500/30 text-red-300", DOCX: "bg-blue-500/30 text-blue-300", PPTX: "bg-orange-500/30 text-orange-300" };
          return (
            <a
              key={i}
              href={`${base}${d.url}`}
              target="_blank"
              rel="noopener noreferrer"
              download={d.name}
              className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition cursor-pointer group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${colorMap[ext] || colorMap.PDF}`}>
                {ext}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-white/50">{d.category}</p>
              </div>
              <Download className="w-4 h-4 text-white/30 group-hover:text-white/80 transition" />
            </a>
          );
        })}
      </div>
    );
  },

  "Videos RSE": function VideosModal() {
    const videos = [
      { title: "Programa de Reciclaje en la Empresa",        dur: "4:32", color: "from-green-600 to-teal-700" },
      { title: "Voluntariado Comunitario",                   dur: "6:14", color: "from-blue-600 to-indigo-700" },
      { title: "Balance de Carbono 2024",                    dur: "3:48", color: "from-violet-600 to-purple-700" },
      { title: "Diversidad e Inclusión en el Trabajo",       dur: "5:20", color: "from-rose-600 to-pink-700" },
      { title: "Impacto Social: Programa Comunidad Barú",    dur: "7:05", color: "from-amber-600 to-orange-700" },
    ];
    return (
      <div className="space-y-3">
        <p className="text-xs text-white/40 mb-2">Contenido de referencia — sube tus videos reales desde Comunicación</p>
        {videos.map((v, i) => (
          <div key={i} className="flex gap-3 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition cursor-pointer">
            <div className={`w-28 h-16 rounded-xl bg-gradient-to-br ${v.color} flex items-center justify-center shrink-0`}>
              <Video className="w-6 h-6 text-white/80" />
            </div>
            <div className="flex-1 min-w-0 py-1">
              <p className="text-sm font-medium leading-tight">{v.title}</p>
              <p className="text-xs text-white/50 mt-2">{v.dur}</p>
            </div>
          </div>
        ))}
      </div>
    );
  },

  // ══════════════════════════════════════════════════
  //  INDICADORES (un componente por eje)
  // ══════════════════════════════════════════════════

  "Gobernanza":     function GobernanzaModal()    { return <EjeDetailModal category="Gobernanza" />; },
  "Clientes":       function ClientesModal()       { return <EjeDetailModal category="Clientes" />; },
  "Comunidad":      function ComunidadModal()      { return <EjeDetailModal category="Comunidad" />; },
  "Trabajadores":   function TrabajadoresModal()   { return <EjeDetailModal category="Trabajadores" />; },
  "Medio ambiente": function MedioAmbienteModal()  { return <EjeDetailModal category="Medio ambiente" />; },

  // ══════════════════════════════════════════════════
  //  REPORTE
  // ══════════════════════════════════════════════════

  "Reportes generales": function ReportesModal() {
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
      apiGetReportes().then(setReportes).catch(() => {}).finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;
    if (reportes.length === 0) return <EmptyState icon={FileText} text="No hay reportes generados aún" />;

    const FMT_COLOR = {
      PDF:   "bg-red-500/30 text-red-300",
      Excel: "bg-green-500/30 text-green-300",
      CSV:   "bg-gray-500/30 text-gray-300",
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total generados"   value={reportes.length}  icon={FileText}  from="from-blue-500"   to="to-blue-700" />
          <StatCard label="Tipos distintos"   value={[...new Set(reportes.map(r => r.type))].length} icon={Download} from="from-violet-500" to="to-violet-700" />
        </div>
        {reportes.slice(0, 6).map((r, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition cursor-pointer group">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${FMT_COLOR[r.type] || FMT_COLOR.PDF}`}>
              {r.type}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{r.title}</p>
              <p className="text-xs text-white/50">
                {new Date(r.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <Download className="w-4 h-4 text-white/30 group-hover:text-white/80 transition" />
          </div>
        ))}
      </div>
    );
  },

  "Exportar PDF / Excel": function ExportarModal() {
    const [generating, setGenerating] = useState({});
    const [done, setDone]             = useState({});

    const modules = [
      { mod: "Indicadores de Sostenibilidad", icon: TrendingUp },
      { mod: "Reporte de Capacitación",       icon: BookOpen },
      { mod: "Encuesta de Clima Laboral",     icon: Users },
      { mod: "Actividad del Sistema",         icon: Shield },
      { mod: "NPS y Satisfacción de Clientes",icon: Star },
    ];

    const handleExport = async (modulo, tipo) => {
      const key = `${modulo}-${tipo}`;
      if (generating[key]) return;
      setGenerating(prev => ({ ...prev, [key]: true }));
      try {
        await apiCreateReporte({ title: modulo, type: tipo });
        setDone(prev => ({ ...prev, [key]: true }));
        setTimeout(() => setDone(prev => ({ ...prev, [key]: false })), 3000);
      } catch {
        alert("Error al generar el reporte");
      } finally {
        setGenerating(prev => ({ ...prev, [key]: false }));
      }
    };

    return (
      <div className="space-y-3">
        <p className="text-sm text-white/60">Selecciona el módulo y formato</p>
        {modules.map((m, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <m.icon className="w-4 h-4" />
            </div>
            <p className="text-sm flex-1">{m.mod}</p>
            <div className="flex gap-2">
              {["PDF", "Excel"].map(tipo => {
                const key  = `${m.mod}-${tipo}`;
                const busy = generating[key];
                const ok   = done[key];
                return (
                  <button
                    key={tipo}
                    onClick={() => handleExport(m.mod, tipo)}
                    disabled={busy}
                    className={`px-3 py-1.5 text-white text-xs rounded-lg font-medium transition flex items-center gap-1 disabled:opacity-60
                      ${ok ? "bg-green-500" : tipo === "PDF" ? "bg-red-500/80 hover:bg-red-500" : "bg-green-600/80 hover:bg-green-600"}`}
                  >
                    {ok ? <><CheckCircle className="w-3 h-3" /> Listo</> : busy ? "Generando..." : <><Download className="w-3 h-3" /> {tipo}</>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  },

  // ══════════════════════════════════════════════════
  //  USUARIO
  // ══════════════════════════════════════════════════

  "Lista de usuarios": function ListaUsuariosModal() {
    const [users, setUsers]       = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
      apiGetUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;
    if (users.length === 0) return <EmptyState icon={Users} text="Sin usuarios registrados" />;

    const activos = users.filter(u => u.active).length;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Total"       value={users.length} icon={Users}        from="from-blue-500"  to="to-blue-700" />
          <StatCard label="Activos"     value={activos}      icon={CheckCircle}  from="from-green-500" to="to-green-700" />
          <StatCard label="Inactivos"   value={users.length - activos} icon={Clock} from="from-gray-500"  to="to-gray-700" />
        </div>
        {users.slice(0, 6).map((u, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center shrink-0 text-sm font-bold text-white">
              {u.name.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{u.name}</p>
              <p className="text-xs text-white/50 truncate">{u.email}</p>
            </div>
            <Badge text={ROLE_LABELS[u.role] || u.role} color={ROL_COLOR[u.role] || "bg-white/20 text-white/70"} />
            <div className={`w-2 h-2 rounded-full shrink-0 ${u.active ? "bg-green-400" : "bg-gray-500"}`} />
          </div>
        ))}
      </div>
    );
  },

  "Roles": function RolesModal() {
    const [users, setUsers]       = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
      apiGetUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;

    const roles = Object.keys(ROLE_LABELS).map(rol => ({
      rol,
      label: ROLE_LABELS[rol],
      n: users.filter(u => u.role === rol).length,
      gradient: ROL_GRADIENT[rol],
    }));

    return (
      <div className="space-y-3">
        {roles.map((r, i) => (
          <div key={i} className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${r.gradient} text-white`}>
            <div>
              <p className="font-semibold text-sm">{r.label}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{r.n}</p>
              <p className="text-xs opacity-70">usuarios</p>
            </div>
          </div>
        ))}
      </div>
    );
  },

  "Permisos": function PermisosModal() {
    return (
      <div className="space-y-3">
        <p className="text-sm text-white/60 mb-2">Matriz de permisos por rol</p>
        <div className="bg-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-white/10">
              <tr className="text-white/60">
                <th className="text-left p-3">Módulo</th>
                <th className="text-center p-3">PM</th>
                <th className="text-center p-3">Admin</th>
                <th className="text-center p-3">RRHH</th>
                <th className="text-center p-3">Com.</th>
                <th className="text-center p-3">Colab.</th>
              </tr>
            </thead>
            <tbody>
              {[
                { mod: "Usuarios",       pm: true,  admin: false, rrhh: true,  com: false, col: false },
                { mod: "Cursos",         pm: true,  admin: true,  rrhh: false, com: false, col: "R" },
                { mod: "Avisos",         pm: true,  admin: true,  rrhh: false, com: true,  col: "R" },
                { mod: "Indicadores",    pm: true,  admin: true,  rrhh: false, com: false, col: "R" },
                { mod: "Reportes",       pm: true,  admin: true,  rrhh: true,  com: false, col: false },
                { mod: "Configuración",  pm: true,  admin: false, rrhh: false, com: false, col: false },
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/10 hover:bg-white/5 transition">
                  <td className="p-3 text-white/80 font-medium">{row.mod}</td>
                  {[row.pm, row.admin, row.rrhh, row.com, row.col].map((v, j) => (
                    <td key={j} className="text-center p-3">
                      {v === true  ? <CheckCircle className="w-3.5 h-3.5 text-green-400 mx-auto" />
                       : v === "R" ? <span className="text-amber-400 font-bold">R</span>
                       :             <span className="text-white/20">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-white/40 text-center">R = Solo lectura · ✓ = Lectura y escritura</p>
      </div>
    );
  },

  // ══════════════════════════════════════════════════
  //  CONFIGURACIÓN
  // ══════════════════════════════════════════════════

  "Seguridad": function SeguridadModal() {
    return (
      <div className="space-y-4">
        <div className="bg-white/10 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold">Sesión y acceso</p>
          {[
            { label: "Expiración de sesión (8h)", enabled: true },
            { label: "Bloqueo en usuario inactivo", enabled: true },
            { label: "Autenticación de 2 factores", enabled: false },
          ].map((opt, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-white/80">{opt.label}</span>
              <div className={`w-10 h-5 rounded-full relative ${opt.enabled ? "bg-blue-500" : "bg-white/20"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${opt.enabled ? "right-0.5" : "left-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white/10 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold">Requisitos de contraseña</p>
          {[
            { label: "Mínimo 8 caracteres", ok: true },
            { label: "Cambio obligatorio en primer ingreso", ok: true },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 shrink-0 ${r.ok ? "text-green-400" : "text-white/20"}`} />
              <span className={`text-sm ${r.ok ? "text-white/80" : "text-white/40"}`}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },

  "Preferencias": function PreferenciasModal() {
    return (
      <div className="space-y-4">
        <div className="bg-white/10 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold">Idioma y región</p>
          {[
            { label: "Idioma",          val: "Español (MX)" },
            { label: "Zona horaria",    val: "America/Mexico_City" },
            { label: "Formato de fecha",val: "DD / MM / YYYY" },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
              <span className="text-sm text-white/50">{f.label}</span>
              <span className="text-sm bg-white/10 px-3 py-1 rounded-lg">{f.val}</span>
            </div>
          ))}
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
          Más preferencias estarán disponibles en la sección de Configuración completa.
        </div>
      </div>
    );
  },

  "Datos empresa": function DatosEmpresaModal() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shrink-0">
            <Building className="w-8 h-8 text-white/60" />
          </div>
          <div>
            <p className="font-bold text-lg">Grupo BARÚ</p>
            <p className="text-xs text-white/50">Industria hotelera y A&B</p>
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 space-y-3">
          {[
            { label: "País",    val: "México" },
            { label: "Estado",  val: "Quintana Roo" },
            { label: "Sector",  val: "Turismo y Hotelería" },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between border-b border-white/10 pb-2.5 last:border-0 last:pb-0">
              <span className="text-xs text-white/50">{f.label}</span>
              <span className="text-sm">{f.val}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// ─── Componente compartido para modales de eje RSE ────────────────────────────

const EJE_INFO = {
  "Gobernanza":     { icon: Shield, color: "from-blue-500 to-blue-700",   sub: "Contratos, convenios, código de ética y compras" },
  "Clientes":       { icon: Star,   color: "from-amber-500 to-amber-700",  sub: "NPS, satisfacción y encuestas por área" },
  "Comunidad":      { icon: Heart,  color: "from-green-500 to-green-700",  sub: "Programas sociales, campañas y participación" },
  "Trabajadores":   { icon: Users,  color: "from-violet-500 to-violet-700",sub: "Indicadores laborales, rotación y clima" },
  "Medio ambiente": { icon: Leaf,   color: "from-teal-500 to-teal-700",   sub: "Acciones RSE, consumo energético y campañas" },
};

function EjeDetailModal({ category }) {
  const [inds, setInds]         = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    apiGetLatestIndicadores().then(setInds).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const eje   = inds.find(i => i.category === category);
  const cfg   = EJE_INFO[category] || { icon: Globe, color: "from-gray-500 to-gray-700", sub: "" };
  const Icon  = cfg.icon;
  const pct   = eje ? Math.round(eje.value) : null;

  return (
    <div className="space-y-4">
      {eje ? (
        <div className={`rounded-2xl p-6 bg-gradient-to-br ${cfg.color} text-white text-center`}>
          <Icon className="w-8 h-8 mx-auto mb-2 opacity-80" />
          <p className="text-5xl font-black">{pct}%</p>
          <p className="text-sm opacity-80 mt-1">{category} · {eje.period}</p>
          <p className="text-xs opacity-60 mt-2">{eje.label}</p>
        </div>
      ) : (
        <EmptyState icon={Icon} text={`Sin datos de ${category} aún`} />
      )}
      <div className="bg-white/10 rounded-xl p-4">
        <p className="text-sm text-white/60">{cfg.sub}</p>
        <div className="mt-3 border border-dashed border-white/20 rounded-xl p-3 text-center text-xs text-white/40">
          El detalle de indicadores específicos se habilitará próximamente. Actualiza el % desde la página de Indicadores.
        </div>
      </div>
    </div>
  );
}

export default modalContent;
