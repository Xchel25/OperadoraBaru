import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  apiGetReportes, apiCreateReporte, apiDeleteReporte,
  apiGetIndicadores, apiGetCourses, apiGetNotices,
} from "../services/api";
import {
  FileText, Download, TrendingUp, BookOpen, Bell,
  Clock, Trash2, CheckCircle, User, Calendar, Users,
  AlertTriangle, BarChart3, Activity,
} from "lucide-react";
import { usePermission } from "../hooks/usePermission";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../config/roles";
import { useLanguage } from "../context/LanguageContext";

// ─── CSV HELPERS ─────────────────────────────────────────────────────────────

function escapeCsv(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function buildCsv(headers, rows) {
  const head = headers.map(escapeCsv).join(",");
  const body = rows.map(r => r.map(escapeCsv).join(",")).join("\n");
  return `${head}\n${body}`;
}

function triggerDownload(filename, csv) {
  const bom = "﻿"; // UTF-8 BOM so Excel reads accents correctly
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
}

// ─── REPORT MODULE DEFINITIONS ───────────────────────────────────────────────

const MODULES = [
  {
    id:          "indicadores",
    title:       "Indicadores RSE",
    description: "Todos los ejes de sostenibilidad — valores, períodos y fechas de registro",
    icon:        TrendingUp,
    gradient:    "from-blue-500 to-violet-600",
    color:       "#6366f1",
    fetch:       apiGetIndicadores,
    filename:    () => `RSE_Indicadores_${new Date().toISOString().slice(0,10)}.csv`,
    toCsv: (data) => buildCsv(
      ["Eje", "Valor (%)", "Período", "Fecha de registro"],
      data.map(r => [r.category, r.value, r.period, fmtDate(r.createdAt)])
    ),
  },
  {
    id:          "capacitacion",
    title:       "Capacitación",
    description: "Cursos activos con instructor, categoría, completados e iniciados",
    icon:        BookOpen,
    gradient:    "from-amber-500 to-orange-600",
    color:       "#f59e0b",
    fetch:       apiGetCourses,
    filename:    () => `Capacitacion_${new Date().toISOString().slice(0,10)}.csv`,
    toCsv: (data) => buildCsv(
      ["Título", "Instructor", "Categoría", "Obligatorio", "Iniciados", "Completados", "Total usuarios", "Fecha de creación"],
      data.map(r => [
        r.title, r.instructor, r.category,
        r.mandatory ? "Sí" : "No",
        r.stats?.started ?? "", r.stats?.completed ?? "", r.stats?.total ?? "",
        fmtDate(r.createdAt),
      ])
    ),
  },
  {
    id:          "comunicacion",
    title:       "Comunicación",
    description: "Avisos publicados — tipo, autor y fecha de cada mensaje",
    icon:        Bell,
    gradient:    "from-green-500 to-emerald-600",
    color:       "#22c55e",
    fetch:       apiGetNotices,
    filename:    () => `Comunicacion_Avisos_${new Date().toISOString().slice(0,10)}.csv`,
    toCsv: (data) => buildCsv(
      ["Título", "Tipo", "Autor", "Fecha"],
      data.map(r => [r.title, r.type, r.author?.name || "Sistema", fmtDate(r.createdAt)])
    ),
  },
  {
    id:          "actividad",
    title:       "Historial de reportes",
    description: "Registro completo de exportaciones — quién generó qué y cuándo",
    icon:        Activity,
    gradient:    "from-gray-500 to-gray-700",
    color:       "#6b7280",
    fetch:       apiGetReportes,
    filename:    () => `Historial_Reportes_${new Date().toISOString().slice(0,10)}.csv`,
    toCsv: (data) => buildCsv(
      ["Título", "Tipo", "Generado por", "Fecha"],
      data.map(r => [r.title, r.type, r.user?.name || "", fmtDate(r.createdAt)])
    ),
  },
];

// ─── DIVERGING CHART ─────────────────────────────────────────────────────────

function ReportDivergingChart({ reportes, modules }) {
  const counts = modules.map(m => ({
    ...m,
    count: reportes.filter(r => r.title === m.title).length,
  }));
  const total = counts.reduce((a, c) => a + c.count, 0);
  const avg   = counts.length ? total / counts.length : 0;

  if (total === 0) return null;

  const maxDeviation = Math.max(...counts.map(c => Math.abs(c.count - avg)), 1);

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-bold text-gray-800 dark:text-white">Actividad de exportación por módulo</h2>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
            Reportes generados por módulo — línea central = promedio ({avg.toFixed(1)} reportes)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-white/40 shrink-0">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />Sobre promedio</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300 dark:bg-white/20 inline-block" />Bajo promedio</span>
        </div>
      </div>

      {/* Scale */}
      <div className="flex items-center mt-5 mb-1 pl-36 pr-20">
        <div className="flex-1 flex">
          <div className="flex-1 flex justify-between pr-3 text-xs text-gray-300 dark:text-white/20">
            <span>↑ máx</span>
            <span></span>
          </div>
          <div className="px-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-white/50 whitespace-nowrap">promedio</span>
          </div>
          <div className="flex-1 flex justify-between pl-3 text-xs text-gray-300 dark:text-white/20">
            <span></span>
            <span>máx ↑</span>
          </div>
        </div>
      </div>

      {/* Bars */}
      <div className="relative pl-36 pr-20">
        {/* Background zones */}
        <div className="absolute inset-y-0 left-36 right-20 pointer-events-none">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-red-50/30 dark:bg-white/3 rounded-l-lg" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-50/40 dark:bg-blue-500/3 rounded-r-lg" />
          <div className="absolute inset-y-0 w-px bg-gray-200 dark:bg-white/15 z-10" style={{ left: "50%" }} />
        </div>

        <div className="space-y-2">
          {counts.sort((a, b) => b.count - a.count).map((m) => {
            const deviation  = m.count - avg;
            const isAbove    = deviation >= 0;
            const barPct     = (Math.abs(deviation) / maxDeviation) * 100;
            const ModIcon    = m.icon;

            return (
              <div key={m.id} className="flex items-center h-10 relative group">
                {/* LEFT */}
                <div className="flex-1 flex justify-end items-center h-full pr-0.5">
                  {!isAbove && barPct > 0 && (
                    <div
                      className="h-7 rounded-l-lg bg-gradient-to-l from-gray-400 to-gray-300 dark:from-white/30 dark:to-white/10 transition-all duration-700"
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>

                {/* CENTER */}
                <div className="w-0.5 h-10 bg-gray-200 dark:bg-white/15 z-10 shrink-0 relative">
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-300 dark:bg-white/30" />
                </div>

                {/* RIGHT */}
                <div className="flex-1 flex items-center h-full pl-0.5">
                  {isAbove && barPct > 0 && (
                    <div
                      className="h-7 rounded-r-lg transition-all duration-700"
                      style={{
                        width: `${barPct}%`,
                        background: `linear-gradient(to right, ${m.color}99, ${m.color})`,
                      }}
                    />
                  )}
                </div>

                {/* Tooltip */}
                <div className="absolute z-20 top-0 left-1/2 -translate-x-1/2 -translate-y-full pt-0 opacity-0 group-hover:opacity-100 pointer-events-none transition">
                  <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                    <span className="font-bold">{m.title}</span>: {m.count} reporte{m.count !== 1 ? "s" : ""}
                    <span className={`ml-2 ${isAbove ? "text-blue-300" : "text-gray-400"}`}>
                      ({isAbove ? "+" : ""}{deviation.toFixed(1)} vs promedio)
                    </span>
                  </div>
                  <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 mx-auto -mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels - left */}
      <div className="relative">
        <div className="absolute top-0 left-0 space-y-2" style={{ marginTop: `-${counts.length * 40}px` }}>
          {counts.sort((a, b) => b.count - a.count).map((m) => {
            const ModIcon = m.icon;
            return (
              <div key={m.id} className="flex items-center gap-2 h-10 w-36">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${m.color}99, ${m.color})` }}>
                  <ModIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-white/60 truncate">{m.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels - right (counts) */}
      <div className="relative">
        <div className="absolute top-0 right-0 space-y-2" style={{ marginTop: `-${counts.length * 40}px` }}>
          {counts.sort((a, b) => b.count - a.count).map((m) => (
            <div key={m.id} className="flex items-center justify-end gap-1.5 h-10 w-20">
              <span className="text-sm font-black text-gray-700 dark:text-white">{m.count}</span>
              <span className="text-xs text-gray-400 dark:text-white/30">rep.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MODULE CARD ─────────────────────────────────────────────────────────────

function ModuleCard({ mod, onDownload, count, downloading, done, error }) {
  const ModIcon = mod.icon;
  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 hover:shadow-lg dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all group">
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg shrink-0`}>
          <ModIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-sm text-gray-800 dark:text-white">{mod.title}</h3>
            {count > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40 shrink-0">
                {count} generado{count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-1 leading-relaxed">{mod.description}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs mb-3">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={() => onDownload(mod)}
        disabled={downloading}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2
          ${done
            ? "bg-green-500 text-white"
            : downloading
            ? "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/40 cursor-not-allowed"
            : "text-white shadow-md"
          }`}
        style={!done && !downloading ? { background: `linear-gradient(135deg, ${mod.color}cc, ${mod.color})` } : {}}
      >
        {done
          ? <><CheckCircle className="w-4 h-4" /> Descargado</>
          : downloading
          ? <><span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" /> Generando...</>
          : <><Download className="w-4 h-4" /> Descargar CSV</>
        }
      </button>

      <p className="text-xs text-center text-gray-300 dark:text-white/20 mt-2">
        Compatible con Excel · Google Sheets
      </p>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function Reporte() {
  const { t } = useLanguage();
  const [reportes, setReportes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [downloading, setDownloading] = useState({});
  const [done, setDone]               = useState({});
  const [errors, setErrors]           = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [filterMod, setFilterMod]     = useState("todos");

  const canCreate = usePermission("canCreateReportes");
  const canView   = usePermission("canViewReportes");
  const { user }  = useAuth();

  const isProjectManager = user?.role === "PROJECT_MANAGER";

  useEffect(() => {
    apiGetReportes()
      .then(setReportes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = useCallback(async (mod) => {
    if (downloading[mod.id] || !canCreate) return;
    setDownloading(prev => ({ ...prev, [mod.id]: true }));
    setErrors(prev => ({ ...prev, [mod.id]: null }));
    try {
      const data = await mod.fetch();
      const csv  = mod.toCsv(data);
      triggerDownload(mod.filename(), csv);
      const nuevo = await apiCreateReporte({ title: mod.title, type: "CSV" });
      setReportes(prev => [nuevo, ...prev]);
      setDone(prev => ({ ...prev, [mod.id]: true }));
      setTimeout(() => setDone(prev => ({ ...prev, [mod.id]: false })), 3500);
    } catch {
      setErrors(prev => ({ ...prev, [mod.id]: "Error al obtener los datos. Verifica tu conexión." }));
    } finally {
      setDownloading(prev => ({ ...prev, [mod.id]: false }));
    }
  }, [downloading, canCreate]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiDeleteReporte(confirmDelete.id);
      setReportes(prev => prev.filter(r => r.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch { /* no-op */ } finally {
      setDeleting(false);
    }
  };

  const now    = new Date();
  const thisMonth = reportes.filter(r => {
    const d = new Date(r.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const uniqueUsers = new Set(reportes.map(r => r.user?.name).filter(Boolean)).size;

  const moduleNames = MODULES.map(m => m.title);
  const filteredHistory = filterMod === "todos"
    ? reportes
    : reportes.filter(r => r.title === filterMod);

  if (!canView) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-300 dark:text-white/20" />
          </div>
          <p className="font-semibold text-gray-600 dark:text-white/50">Sin acceso a reportes</p>
          <p className="text-sm text-gray-400 dark:text-white/30">Tu rol no tiene permiso para ver esta sección.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("rep_title")}</h1>
            <p className="text-sm text-gray-400 dark:text-white/40 mt-1">{t("rep_sub")}</p>
          </div>
          <div className="sm:text-right shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-medium text-gray-600 dark:text-white/60">
              <User className="w-3.5 h-3.5" />
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-1">
              {canCreate ? "Puede generar y descargar reportes" : "Solo lectura"}
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Reportes totales",    value: loading ? "—" : reportes.length,  icon: FileText,  bg: "bg-blue-50 dark:bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400",    border: "border-blue-100 dark:border-blue-500/20" },
            { label: "Generados este mes",  value: loading ? "—" : thisMonth,         icon: Calendar,  bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", border: "border-violet-100 dark:border-violet-500/20" },
            { label: "Módulos disponibles", value: MODULES.length,                    icon: BarChart3, bg: "bg-amber-50 dark:bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",  border: "border-amber-100 dark:border-amber-500/20" },
            { label: "Usuarios que exportaron", value: loading ? "—" : uniqueUsers,  icon: Users,     bg: "bg-green-50 dark:bg-green-500/10",   text: "text-green-600 dark:text-green-400",  border: "border-green-100 dark:border-green-500/20" },
          ].map((s, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${s.border} ${s.bg}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-white/10 shadow-sm shrink-0">
                <s.icon className={`w-5 h-5 ${s.text}`} />
              </div>
              <div>
                <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-400 dark:text-white/40">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* DIVERGING CHART — solo escritorio */}
        {!loading && (
          <div className="hidden sm:block">
            <ReportDivergingChart reportes={reportes} modules={MODULES} />
          </div>
        )}

        {/* MODULE CARDS */}
        {canCreate && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-white">Módulos de exportación</h2>
              <p className="text-xs text-gray-400 dark:text-white/40">El archivo se descarga automáticamente con datos reales</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {MODULES.map(mod => (
                <ModuleCard
                  key={mod.id}
                  mod={mod}
                  onDownload={handleDownload}
                  count={reportes.filter(r => r.title === mod.title).length}
                  downloading={!!downloading[mod.id]}
                  done={!!done[mod.id]}
                  error={errors[mod.id]}
                />
              ))}
            </div>
          </div>
        )}

        {/* HISTORIAL */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 shrink-0">
              <Clock className="w-4 h-4 text-gray-400 dark:text-white/40" />
              Historial de exportaciones
            </h2>
            {/* Filter chips */}
            <div className="flex gap-2 flex-wrap">
              {["todos", ...moduleNames].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterMod(f)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    filterMod === f
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {f === "todos" ? "Todos" : f.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-white/30">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{filterMod === "todos" ? "Aún no se han generado reportes" : `Sin reportes de ${filterMod}`}</p>
              {canCreate && filterMod === "todos" && (
                <p className="text-xs mt-1">Usa los módulos de arriba para generar tu primer reporte</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredHistory.map((r) => {
                const mod = MODULES.find(m => m.title === r.title);
                const ModIcon = mod?.icon || FileText;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition group"
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: mod ? `linear-gradient(135deg, ${mod.color}80, ${mod.color})` : "#6b728080" }}
                    >
                      <ModIcon className="w-4 h-4 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{r.title}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-white/40 mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {r.user?.name || "Sistema"}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Format badge */}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-medium shrink-0">
                      {r.type || "CSV"}
                    </span>

                    {/* Delete — solo PROJECT_MANAGER */}
                    {isProjectManager && (
                      <button
                        onClick={() => setConfirmDelete(r)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 dark:text-white/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition shrink-0"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ROL INFO PANEL */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 dark:text-white/40" />
            Acceso por rol a esta sección
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { role: "PROJECT_MANAGER", label: "Project Manager",       permisos: ["Ver todos los reportes", "Generar y descargar CSVs", "Eliminar registros del historial"] },
              { role: "ADMIN_AREA",      label: "Admin de Área",          permisos: ["Ver todos los reportes", "Generar y descargar CSVs"] },
              { role: "RRHH",            label: "Recursos Humanos",       permisos: ["Ver todos los reportes", "Generar y descargar CSVs"] },
            ].map((r) => {
              const isCurrent = user?.role === r.role;
              return (
                <div
                  key={r.role}
                  className={`p-4 rounded-xl border transition ${isCurrent ? "border-blue-300 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10" : "border-gray-100 dark:border-white/10"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`text-xs font-bold ${isCurrent ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-white/70"}`}>{r.label}</p>
                    {isCurrent && <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500 text-white">Tú</span>}
                  </div>
                  <ul className="space-y-1">
                    {r.permisos.map((p, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/50">
                        <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-3">
            Los roles <strong>Comunicación</strong> y <strong>Colaborador</strong> no tienen acceso a esta sección.
          </p>
        </div>

      </div>

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">Eliminar registro</p>
                <p className="text-xs text-gray-400 dark:text-white/40">Solo se elimina el registro del historial</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3">
              <span className="font-semibold">"{confirmDelete.title}"</span>
              <span className="block text-xs text-gray-400 mt-0.5">Generado por {confirmDelete.user?.name} el {fmtDate(confirmDelete.createdAt)}</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60">
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default Reporte;
