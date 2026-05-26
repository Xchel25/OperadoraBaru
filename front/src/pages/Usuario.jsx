import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { apiGetUsers, apiCreateUser, apiUpdateUser, apiGetPendingDevices, apiApproveDevice, apiRejectDevice, apiGetUserDesempeno } from "../services/api";
import {
  Users, CheckCircle, Shield, Plus, Search,
  UserCheck, UserX, Edit2, X, ChevronDown, Clock, Smartphone,
  Award, BookOpen, Activity, TrendingUp, ChevronRight,
} from "lucide-react";
import { usePermission } from "../hooks/usePermission";
import { ROLE_LABELS } from "../config/roles";
import Modal from "../components/Modal";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const ROL_COLOR = {
  PROJECT_MANAGER: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20",
  ADMIN_AREA:      "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
  RRHH:            "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-500/20",
  COMUNICACION:    "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
  COLABORADOR:     "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20",
};

const ROL_GRADIENT = {
  PROJECT_MANAGER: "from-red-500 to-rose-600",
  ADMIN_AREA:      "from-blue-500 to-blue-600",
  RRHH:            "from-violet-500 to-violet-600",
  COMUNICACION:    "from-amber-500 to-amber-600",
  COLABORADOR:     "from-green-500 to-green-600",
};

const ROL_AVATAR = {
  PROJECT_MANAGER: "from-red-400 to-rose-500",
  ADMIN_AREA:      "from-blue-400 to-blue-600",
  RRHH:            "from-violet-400 to-violet-600",
  COMUNICACION:    "from-amber-400 to-amber-600",
  COLABORADOR:     "from-emerald-400 to-emerald-600",
};

// ─── Helpers de actividad ────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 1)   return "Ahora mismo";
  if (mins < 60)  return `Hace ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24)     return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1)    return "Ayer";
  if (d < 7)      return `Hace ${d} días`;
  return new Date(dateStr).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("es-MX", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function sessionDuration(lastLoginAt, lastActivityAt) {
  if (!lastLoginAt || !lastActivityAt) return null;
  const ms = new Date(lastActivityAt) - new Date(lastLoginAt);
  if (ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1)  return "Menos de 1 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getActivityStatus(u) {
  if (!u.lastActivityAt) return { label: "Nunca ha ingresado", type: "never" };
  const mins = Math.floor((Date.now() - new Date(u.lastActivityAt)) / 60000);
  if (mins < 5)  return { label: "En línea",               type: "online"  };
  if (mins < 30) return { label: `Activo hace ${mins} min`, type: "recent"  };
  return            { label: timeAgo(u.lastActivityAt),    type: "offline" };
}

// ─── Gráfico de barras divergentes por rol ────────────────────────────────────

function RoleDivergingChart({ usuarios, loading }) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            <div className="h-4 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const roles = Object.keys(ROLE_LABELS);
  const counts = roles.map(rol => ({
    rol,
    label: ROLE_LABELS[rol],
    total: usuarios.filter(u => u.role === rol).length,
    active: usuarios.filter(u => u.role === rol && u.active).length,
  }));

  const avg = counts.reduce((s, c) => s + c.total, 0) / (roles.length || 1);
  const maxDev = Math.max(...counts.map(c => Math.abs(c.total - avg)), 0.5);

  return (
    <div>
      {/* Axis header */}
      <div className="flex items-center text-[10px] text-gray-400 dark:text-white/25 mb-5">
        <span className="flex-1 text-right pr-2">- del promedio</span>
        <div className="w-px h-3 bg-gray-300 dark:bg-white/15" />
        <span className="flex-1 pl-2">+ del promedio</span>
      </div>

      <div className="space-y-4">
        {counts.map(r => {
          const dev = r.total - avg;
          const barPct = (Math.abs(dev) / maxDev) * 88;
          const isAbove = dev >= 0;

          return (
            <div key={r.rol} className="group relative">
              {/* Label + count */}
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-xs font-medium text-gray-600 dark:text-white/60 leading-none">
                  {r.label}
                </span>
                <div className="flex items-center gap-2">
                  {r.active < r.total && r.total > 0 && (
                    <span className="text-[10px] text-gray-400 dark:text-white/25">
                      {r.active} activos
                    </span>
                  )}
                  <span className={`text-sm font-black tabular-nums ${r.total > 0 ? "text-gray-800 dark:text-white" : "text-gray-300 dark:text-white/20"}`}>
                    {r.total}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="flex items-center h-5">
                {/* Left half */}
                <div className="flex-1 flex justify-end pr-px overflow-hidden">
                  {!isAbove && r.total > 0 && (
                    <div
                      className={`h-3.5 rounded-l-full bg-gradient-to-l ${ROL_GRADIENT[r.rol]} opacity-80 transition-all duration-700 ease-out`}
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>
                {/* Center baseline */}
                <div className="w-0.5 h-5 bg-gray-200 dark:bg-white/15 shrink-0 z-10" />
                {/* Right half */}
                <div className="flex-1 flex pl-px overflow-hidden">
                  {isAbove && r.total > 0 && (
                    <div
                      className={`h-3.5 rounded-r-full bg-gradient-to-r ${ROL_GRADIENT[r.rol]} opacity-80 transition-all duration-700 ease-out`}
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                  {r.total === 0 && (
                    <div className="h-0.5 w-3 bg-gray-200 dark:bg-white/10 self-center" />
                  )}
                </div>
              </div>

              {/* Hover tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-black text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                {r.total} usuario{r.total !== 1 ? "s" : ""} · {dev >= 0 ? "+" : ""}{dev.toFixed(1)} del promedio
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
        <p className="text-[10px] text-gray-400 dark:text-white/30 text-center">
          Promedio: {avg.toFixed(1)} usuarios por rol
        </p>
      </div>
    </div>
  );
}

// ─── Utilidad global ─────────────────────────────────────────────────────────

const getInitials = name =>
  name?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?";

// ─── Calificación automática de desempeño ────────────────────────────────────

const NIVEL = [
  { min: 90, label: "Sobresaliente", emoji: "🏆", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", bar: "bg-emerald-500" },
  { min: 70, label: "Excelente",     emoji: "🟢", color: "text-green-600 dark:text-green-400",    bg: "bg-green-500/10",   border: "border-green-500/30",   bar: "bg-green-500"   },
  { min: 50, label: "En desarrollo", emoji: "🟡", color: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-500/10",   border: "border-amber-500/30",   bar: "bg-amber-500"   },
  { min: 30, label: "Necesita mejora",emoji:"🟠", color: "text-orange-600 dark:text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  bar: "bg-orange-500"  },
  { min: 0,  label: "Requiere atención",emoji:"🔴",color:"text-red-600 dark:text-red-400",         bg: "bg-red-500/10",     border: "border-red-500/30",     bar: "bg-red-500"     },
];

function getNivel(pts) {
  return NIVEL.find(n => pts >= n.min) || NIVEL[NIVEL.length - 1];
}

function calcularPuntuacion({ user, allCourses }) {
  const progresses = user.progresses || [];
  const obligatorios = allCourses.filter(c => c.mandatory);
  const opcionales   = allCourses.filter(c => !c.mandatory);

  // 40 pts: cursos obligatorios completados
  const obligCompletados = obligatorios.filter(c =>
    progresses.find(p => p.courseId === c.id && p.progress >= 100)
  );
  const ptsOblig = obligatorios.length
    ? (obligCompletados.length / obligatorios.length) * 40 : 40;

  // 20 pts: progreso acumulado en opcionales
  const sumaOpc = opcionales.reduce((acc, c) => {
    const p = progresses.find(pr => pr.courseId === c.id);
    return acc + (p?.progress || 0);
  }, 0);
  const ptsOpc = opcionales.length ? (sumaOpc / (opcionales.length * 100)) * 20 : 20;

  // 25 pts: actividad reciente (lastActivityAt)
  const diasAct = user.lastActivityAt
    ? (Date.now() - new Date(user.lastActivityAt)) / 86400000 : 999;
  const ptsAct = diasAct < 1 ? 25 : diasAct < 3 ? 20 : diasAct < 7 ? 15
               : diasAct < 14 ? 10 : diasAct < 30 ? 5 : 0;

  // 15 pts: login reciente (lastLoginAt)
  const diasLog = user.lastLoginAt
    ? (Date.now() - new Date(user.lastLoginAt)) / 86400000 : 999;
  const ptsLog = diasLog < 2 ? 15 : diasLog < 5 ? 12 : diasLog < 10 ? 8
               : diasLog < 20 ? 4 : 0;

  const total = Math.min(100, Math.round(ptsOblig + ptsOpc + ptsAct + ptsLog));
  return {
    total,
    desglose: {
      obligatorios: { pts: Math.round(ptsOblig), max: 40 },
      opcionales:   { pts: Math.round(ptsOpc),   max: 20 },
      actividad:    { pts: Math.round(ptsAct),    max: 25 },
      consistencia: { pts: Math.round(ptsLog),    max: 15 },
    },
  };
}

// ─── Modal de desempeño ───────────────────────────────────────────────────────

function UserPerformanceDrawer({ open, onClose, desempeno, loading }) {
  if (!open) return null;

  const fmtDate = d => d
    ? new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const fmtDateTime2 = d => d
    ? new Date(d).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

  const puntuacion = desempeno ? calcularPuntuacion(desempeno) : null;
  const nivel      = puntuacion ? getNivel(puntuacion.total) : null;
  const u          = desempeno?.user;
  const allCourses = desempeno?.allCourses || [];
  const progresses = u?.progresses || [];

  const cursosConProgreso = allCourses.map(c => {
    const p = progresses.find(pr => pr.courseId === c.id);
    return { ...c, progress: p?.progress || 0 };
  }).sort((a, b) => (b.mandatory ? 1 : 0) - (a.mandatory ? 1 : 0));

  const completados   = cursosConProgreso.filter(c => c.progress >= 100).length;
  const promedioTotal = cursosConProgreso.length
    ? Math.round(cursosConProgreso.reduce((s, c) => s + c.progress, 0) / cursosConProgreso.length)
    : 0;
  const actStatus = u ? getActivityStatus(u) : null;

  const strokeColor = nivel
    ? (nivel.bar.includes("emerald") ? "#10b981"
      : nivel.bar.includes("green")  ? "#22c55e"
      : nivel.bar.includes("amber")  ? "#f59e0b"
      : nivel.bar.includes("orange") ? "#f97316" : "#ef4444")
    : "#6b7280";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#0f1623] shadow-2xl border border-gray-200 dark:border-white/10">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0 flex items-center justify-between gap-4">
          {u ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${ROL_AVATAR[u.role] || "from-gray-400 to-gray-600"} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                {getInitials(u.name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium border ${ROL_COLOR[u.role] || ""}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="font-semibold text-gray-900 dark:text-white">Desempeño del empleado</p>
          )}
          <button onClick={onClose}
            className="shrink-0 p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && puntuacion && nivel && (
            <div className="space-y-4">

              {/* ── GRID: PUNTUACIÓN + ACTIVIDAD ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Puntuación */}
                <div className={`rounded-2xl border p-5 ${nivel.bg} ${nivel.border}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Award className={`w-4 h-4 ${nivel.color}`} />
                    <span className={`text-sm font-semibold ${nivel.color}`}>Desempeño</span>
                  </div>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-white/10" />
                        <circle cx="40" cy="40" r="32" fill="none" strokeWidth="8"
                          strokeLinecap="round" stroke={strokeColor}
                          strokeDasharray={`${(puntuacion.total / 100) * 201} 201`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{puntuacion.total}</span>
                      </div>
                    </div>
                    <div>
                      <p className={`text-base font-bold ${nivel.color}`}>{nivel.emoji} {nivel.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">sobre 100 pts</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Obligatorios", ...puntuacion.desglose.obligatorios },
                      { label: "Opcionales",   ...puntuacion.desglose.opcionales   },
                      { label: "Actividad",    ...puntuacion.desglose.actividad    },
                      { label: "Consistencia", ...puntuacion.desglose.consistencia },
                    ].map(({ label, pts, max }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-400">{label}</span>
                          <span className="font-semibold text-gray-800 dark:text-white tabular-nums">{pts}/{max}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${nivel.bar}`}
                            style={{ width: `${(pts / max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actividad */}
                <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-gray-400 dark:text-white/40" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Actividad</span>
                    {actStatus && (
                      <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        actStatus.type === "online" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                        actStatus.type === "recent" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                        "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40"
                      }`}>{actStatus.label}</span>
                    )}
                  </div>
                  <div className="space-y-3 text-xs">
                    {[
                      ["Último login",      fmtDateTime2(u?.lastLoginAt)],
                      ["Última actividad",  u?.lastActivityAt ? timeAgo(u.lastActivityAt) : "—"],
                      ["Miembro desde",     fmtDate(u?.createdAt)],
                      ["Primer login hecho",u?.firstLogin ? "Pendiente" : "Completado ✓"],
                      ["Estado de cuenta",  u?.active ? "✅ Activa" : "❌ Inactiva"],
                    ].map(([key, val]) => (
                      <div key={key} className="flex justify-between items-start gap-2">
                        <span className="text-gray-500 dark:text-gray-400 shrink-0">{key}</span>
                        <span className="font-medium text-gray-800 dark:text-white text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── CAPACITACIÓN ── */}
              <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-gray-400 dark:text-white/40" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">Capacitación</span>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {completados}/{cursosConProgreso.length} completados
                  </span>
                </div>
                <div className="mb-4 mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Progreso promedio</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{promedioTotal}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${promedioTotal}%` }} />
                  </div>
                </div>
                <div className="space-y-3">
                  {cursosConProgreso.map(c => (
                    <div key={c.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="shrink-0">{c.progress >= 100 ? "✅" : "⏳"}</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{c.title}</span>
                        {c.mandatory && (
                          <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20 font-medium">
                            Obligatorio
                          </span>
                        )}
                        <span className="shrink-0 text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums w-9 text-right">
                          {c.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden ml-6">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${c.progress >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Formulario crear usuario ─────────────────────────────────────────────────

function UserForm({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", role: "COLABORADOR" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email) { setError("Nombre y correo son obligatorios"); return; }
    setError("");
    setLoading(true);
    try {
      const data = await apiCreateUser(form);
      if (data.tempPassword) setTempPassword(data.tempPassword);
      onSave(data);
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  if (tempPassword) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <p className="font-semibold text-gray-800 dark:text-white">Usuario creado</p>
        <p className="text-sm text-gray-500 dark:text-white/50">
          Comparte esta contraseña temporal. Solo se muestra una vez.
        </p>
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/10 font-mono text-lg font-bold text-gray-900 dark:text-white tracking-widest">
          {tempPassword}
        </div>
        <p className="text-xs text-gray-400 dark:text-white/30">
          El usuario deberá cambiarla al primer ingreso.
        </p>
        <button onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition">
          Entendido
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Nombre completo</label>
        <input name="name" value={form.name} onChange={handleChange}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej. María García López" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Correo institucional</label>
        <input name="email" type="email" value={form.email} onChange={handleChange}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="usuario@operadorabaru.com" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Rol</label>
        <select name="role" value={form.role} onChange={handleChange}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none">
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-60">
          {loading ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}

// ─── Modal editar usuario ─────────────────────────────────────────────────────

function EditUserModal({ user, onSave, onClose }) {
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await apiUpdateUser(user.id, { role, active });
      onSave(updated);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* User preview */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ROL_AVATAR[user.role] || "from-gray-400 to-gray-500"} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
          {user.name?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-800 dark:text-white text-sm">{user.name}</p>
          <p className="text-xs text-gray-400 dark:text-white/40 truncate">{user.email}</p>
        </div>
      </div>

      {/* Activity summary */}
      {(() => {
        const status = getActivityStatus(user);
        const duration = sessionDuration(user.lastLoginAt, user.lastActivityAt);
        return (
          <div className="rounded-xl border border-gray-100 dark:border-white/10 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-white/40 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Actividad
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-white/30">Último ingreso</p>
                <p className="text-xs font-medium text-gray-700 dark:text-white/80 mt-0.5">
                  {user.lastLoginAt ? fmtDateTime(user.lastLoginAt) : "Nunca ha ingresado"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-white/30">Última actividad</p>
                <p className="text-xs font-medium text-gray-700 dark:text-white/80 mt-0.5">
                  {user.lastActivityAt ? timeAgo(user.lastActivityAt) : "—"}
                </p>
              </div>
              {duration && (
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-white/30">Sesión estimada</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-white/80 mt-0.5">{duration}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-gray-400 dark:text-white/30">Estado actual</p>
                <p className={`text-xs font-semibold mt-0.5 ${
                  status.type === "online"  ? "text-emerald-500 dark:text-emerald-400" :
                  status.type === "recent"  ? "text-amber-500 dark:text-amber-400"     :
                  status.type === "never"   ? "text-gray-400 dark:text-white/30"       :
                                              "text-gray-500 dark:text-white/40"
                }`}>{status.label}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Role */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Rol</label>
        <select value={role} onChange={e => setRole(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500">
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Estado */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-2">Estado de acceso</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setActive(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
              active
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}>
            <UserCheck className="w-4 h-4" /> Activo
          </button>
          <button type="button" onClick={() => setActive(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
              !active
                ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400"
                : "border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}>
            <UserX className="w-4 h-4" /> Inactivo
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-60">
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

function Usuario() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios]           = useState([]);
  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState("all");
  const [filterRol, setFilterRol]         = useState("");
  const [loading, setLoading]             = useState(true);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editUser, setEditUser]           = useState(null);
  const [rolDropdown, setRolDropdown]     = useState(false);
  const [pendingDevices, setPendingDevices] = useState([]);
  const [drawerUser, setDrawerUser]         = useState(null);
  const [desempeno, setDesempeno]           = useState(null);
  const [loadingDesempeno, setLoadingDesempeno] = useState(false);
  const canManage = usePermission("canManageUsers");
  const canManageDevices = ["PROJECT_MANAGER", "RRHH"].includes(currentUser?.role);

  const handleUserClick = async (u) => {
    if (!canManageDevices) return;
    setDrawerUser(u);
    setDesempeno(null);
    setLoadingDesempeno(true);
    try {
      const data = await apiGetUserDesempeno(u.id);
      setDesempeno(data);
    } catch { /* silencioso */ }
    finally { setLoadingDesempeno(false); }
  };

  useEffect(() => {
    apiGetUsers()
      .then(setUsuarios)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!canManageDevices) return;
    apiGetPendingDevices()
      .then(setPendingDevices)
      .catch(() => {});
  }, [canManageDevices]);

  const handleApproveDevice = async (id) => {
    try {
      await apiApproveDevice(id);
      setPendingDevices(prev => prev.filter(d => d.id !== id));
    } catch { /* no-op */ }
  };

  const handleRejectDevice = async (id) => {
    try {
      await apiRejectDevice(id);
      setPendingDevices(prev => prev.filter(d => d.id !== id));
    } catch { /* no-op */ }
  };

  const activos      = usuarios.filter(u => u.active).length;
  const inactivos    = usuarios.filter(u => !u.active).length;
  const rolesEnUso   = new Set(usuarios.filter(u => u.active).map(u => u.role)).size;

  const filtrados = usuarios.filter(u => {
    const matchSearch  = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus  = filterStatus === "all" || (filterStatus === "active" ? u.active : !u.active);
    const matchRol     = !filterRol || u.role === filterRol;
    return matchSearch && matchStatus && matchRol;
  });

  const handleSaveEdit = updated => {
    setUsuarios(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
  };

  const STATS = [
    { label: "Total usuarios",  value: loading ? "—" : usuarios.length, icon: Users,       gradient: "from-blue-500 to-blue-700",    note: `${rolesEnUso} roles en uso` },
    { label: "Activos",         value: loading ? "—" : activos,         icon: UserCheck,   gradient: "from-emerald-500 to-emerald-700", note: usuarios.length ? `${Math.round(activos / usuarios.length * 100)}% del total` : null },
    { label: "Inactivos",       value: loading ? "—" : inactivos,       icon: UserX,       gradient: "from-slate-400 to-slate-600",  note: inactivos ? "Sin acceso al sistema" : "Todos activos" },
    { label: "Roles activos",   value: loading ? "—" : rolesEnUso,      icon: Shield,      gradient: "from-violet-500 to-violet-700",note: `de ${Object.keys(ROLE_LABELS).length} roles totales` },
  ];

  const STATUS_TABS = [
    { key: "all",      label: "Todos",    count: usuarios.length },
    { key: "active",   label: "Activos",  count: activos },
    { key: "inactive", label: "Inactivos",count: inactivos },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-7">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("usr_title")}</h1>
            <p className="text-sm text-gray-400 dark:text-white/40 mt-1">{t("usr_sub")}</p>
          </div>
          {canManage && (
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition shadow-lg shadow-blue-500/30">
              <Plus className="w-4 h-4" /> Nuevo usuario
            </button>
          )}
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`rounded-2xl p-5 bg-gradient-to-br ${s.gradient} text-white relative overflow-hidden`}>
                <div className="absolute -right-3 -top-3 w-20 h-20 bg-white/10 rounded-full" />
                <div className="absolute -right-1 -bottom-4 w-14 h-14 bg-white/10 rounded-full" />
                <div className="relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-black tabular-nums">{s.value}</p>
                  <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
                  {s.note && <p className="text-[10px] opacity-50 mt-1">{s.note}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── DISPOSITIVOS PENDIENTES ── */}
        {canManageDevices && pendingDevices.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
                Dispositivos pendientes de aprobación
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                {pendingDevices.length}
              </span>
            </div>
            <div className="space-y-2">
              {pendingDevices.map(device => (
                <div key={device.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-amber-100 dark:border-amber-500/20">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${ROL_AVATAR[device.user?.role] || "from-gray-400 to-gray-600"} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                    {device.user?.name?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{device.user?.name}</p>
                    <p className="text-xs text-gray-400 dark:text-white/40 truncate">{device.user?.email}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${ROL_COLOR[device.user?.role] || ""}`}>
                        {ROLE_LABELS[device.user?.role] || device.user?.role}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-white/30 flex items-center gap-1">
                        <Smartphone className="w-2.5 h-2.5" />
                        {device.label}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-white/30">
                        · {timeAgo(device.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleApproveDevice(device.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition shadow-sm shadow-emerald-500/30">
                      Aprobar
                    </button>
                    <button onClick={() => handleRejectDevice(device.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition shadow-sm shadow-red-500/30">
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LISTA DE USUARIOS ── */}
          <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">

              {/* Status tabs */}
              <div className="flex gap-1.5">
                {STATUS_TABS.map(t => (
                  <button key={t.key} onClick={() => setFilterStatus(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterStatus === t.key
                        ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                        : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10"
                    }`}>
                    {t.label}
                    <span className={`ml-1.5 text-[10px] tabular-nums ${filterStatus === t.key ? "opacity-70" : "opacity-50"}`}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Role dropdown */}
              <div className="relative">
                <button onClick={() => setRolDropdown(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterRol
                      ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                      : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}>
                  <Shield className="w-3 h-3" />
                  {filterRol ? ROLE_LABELS[filterRol] : "Todos los roles"}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {rolDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setRolDropdown(false)} />
                    <div className="absolute left-0 top-9 z-20 bg-white dark:bg-[#1a2236] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl p-1.5 min-w-[190px]">
                      <button onClick={() => { setFilterRol(""); setRolDropdown(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                          !filterRol
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                            : "text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}>
                        Todos los roles
                      </button>
                      {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <button key={key} onClick={() => { setFilterRol(key); setRolDropdown(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                            filterRol === key
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                              : "text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5"
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 ml-auto">
                <Search className="w-3.5 h-3.5 text-gray-400 dark:text-white/40 shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-xs text-gray-500 dark:text-white/50 outline-none w-28 placeholder:text-gray-300 dark:placeholder:text-white/20"
                  placeholder="Buscar..." />
                {search && (
                  <button onClick={() => setSearch("")}>
                    <X className="w-3 h-3 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60" />
                  </button>
                )}
              </div>
            </div>

            {/* Result count */}
            {!loading && (
              <p className="text-xs text-gray-400 dark:text-white/30 mb-3">
                {filtrados.length} usuario{filtrados.length !== 1 ? "s" : ""}
                {(search || filterRol || filterStatus !== "all") ? " encontrados" : ""}
              </p>
            )}

            {/* List */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
              </div>
            ) : filtrados.length === 0 ? (
              <div className="py-14 text-center">
                <Users className="w-8 h-8 text-gray-200 dark:text-white/10 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-white/30">
                  {search || filterRol || filterStatus !== "all"
                    ? "Sin resultados para los filtros aplicados"
                    : "Sin usuarios registrados"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtrados.map(u => {
                  const status = getActivityStatus(u);
                  return (
                  <div key={u.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition group">
                    {/* Avatar + online ring */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ROL_AVATAR[u.role] || "from-gray-400 to-gray-600"} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
                        {getInitials(u.name)}
                      </div>
                      {/* Online indicator dot on avatar */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#111827] ${
                        status.type === "online"  ? "bg-emerald-400" :
                        status.type === "recent"  ? "bg-amber-400"   :
                        status.type === "never"   ? "bg-gray-300 dark:bg-gray-600" :
                                                    "bg-gray-300 dark:bg-gray-600"
                      } ${status.type === "online" ? "animate-pulse" : ""}`} />
                    </div>

                    {/* Name + email + activity */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{u.name}</p>
                        {!u.active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/30 font-medium shrink-0">
                            inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-white/40 truncate">{u.email}</p>
                      <p className={`text-[10px] mt-0.5 font-medium ${
                        status.type === "online"  ? "text-emerald-500 dark:text-emerald-400" :
                        status.type === "recent"  ? "text-amber-500 dark:text-amber-400"     :
                        status.type === "never"   ? "text-gray-300 dark:text-white/20"       :
                                                    "text-gray-400 dark:text-white/30"
                      }`}>{status.label}</p>
                    </div>

                    {/* Role badge */}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border shrink-0 hidden sm:inline-flex ${ROL_COLOR[u.role] || ""}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>

                    {/* Botón ver desempeño */}
                    {canManageDevices && (
                      <button onClick={() => handleUserClick(u)}
                        title="Ver desempeño"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 dark:text-white/20 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition opacity-0 group-hover:opacity-100">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Botón editar */}
                    {canManage && (
                      <button onClick={() => setEditUser(u)}
                        title="Editar usuario"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 dark:text-white/20 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition opacity-0 group-hover:opacity-100">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── DISTRIBUCIÓN POR ROL ── */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
            <div className="mb-5">
              <h2 className="font-semibold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400 dark:text-white/40" />
                Distribución por rol
              </h2>
              <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
                Desviación respecto al promedio del sistema
              </p>
            </div>
            <RoleDivergingChart usuarios={usuarios} loading={loading} />
          </div>

        </div>
      </div>

      {/* ── MODALS ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo usuario">
        <UserForm
          onSave={nuevo => setUsuarios(prev => [nuevo, ...prev])}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar usuario">
        {editUser && (
          <EditUserModal
            user={editUser}
            onSave={handleSaveEdit}
            onClose={() => setEditUser(null)}
          />
        )}
      </Modal>

      {/* ── DRAWER DE DESEMPEÑO ── */}
      <UserPerformanceDrawer
        open={!!drawerUser}
        onClose={() => { setDrawerUser(null); setDesempeno(null); }}
        desempeno={desempeno}
        loading={loadingDesempeno}
      />
    </DashboardLayout>
  );
}

export default Usuario;
