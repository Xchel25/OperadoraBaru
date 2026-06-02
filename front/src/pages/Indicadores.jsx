import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { apiGetLatestIndicadores, apiGetIndicadores, apiCreateIndicador, apiUpdateIndicador } from "../services/api";
import {
  Shield, Star, Heart, Users, Leaf,
  TrendingUp, TrendingDown, Info, Plus, Minus,
  Calendar, RefreshCw,
} from "lucide-react";
import { usePermission } from "../hooks/usePermission";
import Modal from "../components/Modal";
import { useLanguage } from "../context/LanguageContext";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const EJE_CONFIG = {
  "Gobernanza":     { icon: Shield, gradient: "from-blue-500 to-blue-700",    color: "#3b82f6", descripcion: "Contratos, convenios, código de ética y auditorías" },
  "Clientes":       { icon: Star,   gradient: "from-amber-500 to-amber-700",  color: "#f59e0b", descripcion: "NPS, satisfacción y encuestas por área" },
  "Comunidad":      { icon: Heart,  gradient: "from-green-500 to-green-700",  color: "#22c55e", descripcion: "Programas sociales, campañas y participación" },
  "Trabajadores":   { icon: Users,  gradient: "from-violet-500 to-violet-700",color: "#8b5cf6", descripcion: "Indicadores laborales, rotación y clima" },
  "Medio ambiente": { icon: Leaf,   gradient: "from-teal-500 to-teal-700",   color: "#14b8a6", descripcion: "Huella de carbono, energía y reciclaje" },
};

const EJE_DETALLES = {
  "Gobernanza":     ["Cumplimiento normativo (%)", "Contratos y convenios activos", "Código de ética firmado (%)", "Auditorías aprobadas (%)"],
  "Clientes":       ["NPS (Net Promoter Score)", "Satisfacción por área (%)", "Tiempo de respuesta (hrs)", "Quejas resueltas (%)"],
  "Comunidad":      ["Proyectos comunitarios activos", "Voluntariado (horas acumuladas)", "Campañas sociales activas", "Beneficiarios directos"],
  "Trabajadores":   ["Clima laboral (%)", "Rotación de personal (%)", "Capacitaciones completadas", "Accidentes laborales"],
  "Medio ambiente": ["Reducción huella de carbono (%)", "Consumo energético vs objetivo", "Residuos reciclados (%)", "Campañas ecológicas"],
};

const EJE_CATEGORIES = ["Gobernanza", "Clientes", "Comunidad", "Trabajadores", "Medio ambiente"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getSemaforo(pct) {
  if (pct >= 70) return {
    label: "Óptimo", dot: "🟢",
    bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-500/30",
    bar: "from-green-400 to-green-600",
  };
  if (pct >= 40) return {
    label: "En progreso", dot: "🟡",
    bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/30",
    bar: "from-amber-400 to-amber-600",
  };
  return {
    label: "En riesgo", dot: "🔴",
    bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-500/30",
    bar: "from-red-400 to-red-600",
  };
}

// ─── DIVERGING BAR CHART ─────────────────────────────────────────────────────

const BASELINE = 50;

function DivergingChart({ ejes }) {
  const [hovered, setHovered] = useState(null);
  if (!ejes.length) return null;

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-bold text-gray-800 dark:text-white">Gráfico de barras divergentes</h2>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
            Desviación de cada eje respecto a la línea base — cuanto más a la derecha, mejor desempeño
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-white/40 shrink-0">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />En riesgo</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />En progreso</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />Óptimo</span>
        </div>
      </div>

      {/* Scale header */}
      <div className="flex items-center mt-5 mb-1 pl-32 pr-20">
        <div className="flex-1 flex">
          {/* Left half labels */}
          <div className="flex-1 flex justify-between pr-3 text-xs text-gray-300 dark:text-white/20">
            <span>0%</span>
            <span>25%</span>
          </div>
          {/* Baseline label */}
          <div className="flex flex-col items-center" style={{ minWidth: "2px" }}>
            <span className="text-xs font-semibold text-gray-500 dark:text-white/50 whitespace-nowrap -mt-4 mb-1">50% base</span>
          </div>
          {/* Right half labels */}
          <div className="flex-1 flex justify-between pl-3 text-xs text-gray-300 dark:text-white/20">
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Gridlines background */}
      <div className="relative pl-32 pr-20">
        {/* Grid overlay */}
        <div className="absolute inset-y-0 left-32 right-20 pointer-events-none">
          {/* Zone backgrounds */}
          <div className="absolute inset-y-0 left-0 w-1/2 bg-red-50/40 dark:bg-red-500/5 rounded-l-lg" />
          <div className="absolute inset-y-0 right-0 w-1/4 bg-green-50/50 dark:bg-green-500/5 rounded-r-lg" />
          {/* Grid lines at 25% intervals */}
          {[0, 25, 75, 100].map(pos => (
            <div key={pos} className="absolute inset-y-0 w-px bg-gray-100 dark:bg-white/5" style={{ left: `${pos}%` }} />
          ))}
          {/* Center baseline */}
          <div className="absolute inset-y-0 w-0.5 bg-gray-300 dark:bg-white/20 z-10" style={{ left: "50%" }} />
        </div>

        {/* Bars */}
        <div className="space-y-2">
          {ejes.map((eje) => {
            const sem    = getSemaforo(eje.pct);
            const cfg    = EJE_CONFIG[eje.titulo] || {};
            const IconEl = cfg.icon || Shield;
            const isAbove = eje.pct >= BASELINE;
            const deviation = Math.abs(eje.pct - BASELINE);
            const barPct = (deviation / BASELINE) * 100;
            const isHov = hovered === eje.titulo;

            return (
              <div
                key={eje.titulo}
                className="flex items-center h-10 relative"
                onMouseEnter={() => setHovered(eje.titulo)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* LEFT HALF */}
                <div className="flex-1 flex justify-end items-center h-full pr-0.5">
                  {!isAbove && (
                    <div
                      className={`h-7 rounded-l-lg bg-gradient-to-l ${sem.bar} transition-all duration-700 ${isHov ? "opacity-100 shadow-md" : "opacity-85"}`}
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>

                {/* CENTER DOT */}
                <div className="w-0.5 h-10 bg-gray-300 dark:bg-white/20 relative z-10 shrink-0">
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-300 dark:bg-white/30" />
                </div>

                {/* RIGHT HALF */}
                <div className="flex-1 flex items-center h-full pl-0.5">
                  {isAbove && (
                    <div
                      className={`h-7 rounded-r-lg bg-gradient-to-r ${sem.bar} transition-all duration-700 ${isHov ? "opacity-100 shadow-md" : "opacity-85"}`}
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>

                {/* Tooltip on hover */}
                {isHov && (
                  <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-full -mt-2 pointer-events-none">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                      <span className="font-bold">{eje.titulo}</span>: {eje.pct}%
                      {eje.trend && <span className={`ml-2 ${eje.trend.delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {eje.trend.delta >= 0 ? "↑" : "↓"}{Math.abs(eje.trend.delta)} pts
                      </span>}
                    </div>
                    <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 mx-auto -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row labels — rendered separately as absolute overlay */}
      <div className="relative" style={{ marginTop: "-calc(var(--row-count) * 40px)" }}>
        <div className="absolute top-0 left-0 space-y-2" style={{ marginTop: "-" + (ejes.length * 40) + "px" }}>
          {ejes.map((eje) => {
            const cfg    = EJE_CONFIG[eje.titulo] || {};
            const IconEl = cfg.icon || Shield;
            return (
              <div key={eje.titulo} className="flex items-center gap-2 h-10 w-32">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${cfg.gradient || "from-gray-400 to-gray-600"} flex items-center justify-center shrink-0`}>
                  <IconEl className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-white/70 truncate">{eje.titulo}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Value + trend labels on the right */}
      <div className="relative">
        <div className="absolute top-0 right-0 space-y-2" style={{ marginTop: "-" + (ejes.length * 40) + "px" }}>
          {ejes.map((eje) => {
            const sem = getSemaforo(eje.pct);
            return (
              <div key={eje.titulo} className="flex items-center gap-1.5 justify-end h-10 w-20">
                <span className={`text-sm font-black ${sem.text}`}>{eje.pct}%</span>
                {eje.trend && (
                  eje.trend.delta > 0
                    ? <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    : eje.trend.delta < 0
                    ? <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    : <Minus className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trend legend */}
      {ejes.some(e => e.trend) && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center gap-4 text-xs text-gray-400 dark:text-white/40">
          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          <span>Subió vs periodo anterior</span>
          <TrendingDown className="w-3.5 h-3.5 text-red-500 ml-2" />
          <span>Bajó vs periodo anterior</span>
        </div>
      )}
    </div>
  );
}

// ─── EJE CARD ────────────────────────────────────────────────────────────────

function EjeCard({ titulo, descripcion, icon: EjeIcon, gradient, color, pct, trend, expandedEje, onToggleExpand }) {
  const Icon = EjeIcon;
  const sem      = getSemaforo(pct);
  const expanded = expandedEje === titulo;
  const strokeDash = 2 * Math.PI * 26;
  const filled = (pct / 100) * strokeDash;

  return (
    <div className={`bg-white dark:bg-white/5 rounded-2xl border transition-all duration-300 p-5
      ${expanded ? sem.border : "border-gray-100 dark:border-white/10"}
      hover:shadow-xl dark:hover:shadow-black/40 hover:-translate-y-0.5`}
    >
      <div className="flex items-start gap-4">
        {/* Circular progress */}
        <div className="relative shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6"
              className="stroke-gray-100 dark:stroke-white/10" />
            <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6"
              stroke={color}
              strokeDasharray={`${filled} ${strokeDash}`}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black text-gray-800 dark:text-white">{pct}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-white">{titulo}</h3>
            </div>
            <button
              onClick={() => onToggleExpand(titulo)}
              title="¿Qué mide este eje?"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition shrink-0 ${
                expanded
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-500"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-white/40 mb-2 leading-relaxed">{descripcion}</p>

          {/* Semáforo + tendencia */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${sem.bg} ${sem.text} ${sem.border}`}>
              {sem.dot} {sem.label}
            </span>
            {trend && (
              <span className={`flex items-center gap-1 text-xs font-medium ${trend.delta > 0 ? "text-green-600 dark:text-green-400" : trend.delta < 0 ? "text-red-500 dark:text-red-400" : "text-gray-400"}`}>
                {trend.delta > 0
                  ? <TrendingUp className="w-3 h-3" />
                  : trend.delta < 0
                  ? <TrendingDown className="w-3 h-3" />
                  : <Minus className="w-3 h-3" />
                }
                {trend.delta > 0 ? "+" : ""}{trend.delta} pts vs {trend.period}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-1.5 rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Info expandible */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
          <p className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-2 uppercase tracking-wide">¿Qué mide este eje?</p>
          <ul className="space-y-1.5">
            {(EJE_DETALLES[titulo] || []).map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/60">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── INDICADOR FORM ───────────────────────────────────────────────────────────

function IndicadorForm({ indicadores, onSave, onClose }) {
  const [category, setCategory] = useState(EJE_CATEGORIES[0]);
  const [value, setValue]       = useState("");
  const [period, setPeriod]     = useState(() => {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${q}-${now.getFullYear()}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const existing = indicadores.find(i => i.category === category);
  const cfg = EJE_CONFIG[category] || {};
  const IconEl = cfg.icon || Shield;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(value);
    if (isNaN(val) || val < 0 || val > 100) { setError("El valor debe ser entre 0 y 100"); return; }
    setError("");
    setLoading(true);
    try {
      let result;
      if (existing) {
        result = await apiUpdateIndicador(existing.id, { value: val, period });
      } else {
        result = await apiCreateIndicador({ category, label: category, value: val, period });
      }
      onSave(result);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Error al guardar el indicador");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
          <TrendingUp className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <p className="font-semibold text-gray-800 dark:text-white">¡Indicador guardado!</p>
        <p className="text-sm text-gray-500 dark:text-white/50">El valor se ha registrado correctamente.</p>
        <button onClick={onClose} className="w-full py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition">
          Cerrar
        </button>
      </div>
    );
  }

  const preview = value !== "" && !isNaN(parseFloat(value)) ? getSemaforo(parseFloat(value)) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Eje de Sostenibilidad</label>
        <div className="grid grid-cols-1 gap-2">
          {EJE_CATEGORIES.map(cat => {
            const c = EJE_CONFIG[cat] || {};
            const I = c.icon || Shield;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm text-left transition ${
                  category === cat
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-600 dark:text-white/60"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${c.gradient || "from-gray-400 to-gray-600"} flex items-center justify-center shrink-0`}>
                  <I className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{cat}</span>
                  {indicadores.find(i => i.category === cat) && (
                    <span className="ml-2 text-xs opacity-60">
                      actual: {Math.round(indicadores.find(i => i.category === cat).value)}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Valor (0–100)</label>
          <input
            type="number" min="0" max="100" step="0.1"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Ej. 78"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {preview && (
            <span className={`inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${preview.bg} ${preview.text}`}>
              {preview.dot} {preview.label}
            </span>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Periodo</label>
          <input
            value={period}
            onChange={e => setPeriod(e.target.value)}
            placeholder="Ej. Q2-2025"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-60">
          {loading ? "Guardando..." : existing ? "Actualizar" : "Registrar"}
        </button>
      </div>
    </form>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function Indicadores() {
  const { t } = useLanguage();
  const [indicadores, setIndicadores] = useState([]);
  const [historial, setHistorial]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [expandedEje, setExpandedEje] = useState(null);
  const canEdit = usePermission("canEditIndicadores");

  useEffect(() => {
    Promise.all([
      apiGetLatestIndicadores().catch(() => []),
      apiGetIndicadores().catch(() => []),
    ]).then(([latest, all]) => {
      setIndicadores(latest);
      setHistorial(all);
    }).finally(() => setLoading(false));
  }, []);

  const getTrend = (category) => {
    const entries = historial
      .filter(h => h.category === category)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (entries.length < 2) return null;
    const delta = Math.round(entries[0].value - entries[1].value);
    return { delta, period: entries[1].period };
  };

  const ejes = indicadores.map((ind) => {
    const cfg = EJE_CONFIG[ind.category] || { icon: Shield, gradient: "from-gray-500 to-gray-700", color: "#6b7280", descripcion: "" };
    return {
      titulo:      ind.category,
      descripcion: cfg.descripcion,
      icon:        cfg.icon,
      gradient:    cfg.gradient,
      color:       cfg.color,
      pct:         Math.round(ind.value),
      trend:       getTrend(ind.category),
    };
  });

  const resumenGlobal      = ejes.length ? Math.round(ejes.reduce((a, e) => a + e.pct, 0) / ejes.length) : 0;
  const semGlobal          = getSemaforo(resumenGlobal);
  const periodo            = indicadores[0]?.period || "—";
  const ultimaActualizacion = indicadores.length
    ? new Date(Math.max(...indicadores.map(i => new Date(i.createdAt)))).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const ejePorColor = {
    verde:    ejes.filter(e => e.pct >= 70).length,
    amarillo: ejes.filter(e => e.pct >= 40 && e.pct < 70).length,
    rojo:     ejes.filter(e => e.pct < 40).length,
  };

  const globalStroke = 2 * Math.PI * 38;
  const globalFilled = (resumenGlobal / 100) * globalStroke;

  const handleSave = (result) => {
    setIndicadores(prev => {
      const exists = prev.find(ind => ind.id === result.id);
      return exists ? prev.map(ind => ind.id === result.id ? { ...ind, ...result } : ind) : [...prev, result];
    });
    setHistorial(prev => {
      const exists = prev.find(h => h.id === result.id);
      return exists ? prev.map(h => h.id === result.id ? result : h) : [...prev, result];
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("ind_title")}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400 dark:text-white/40">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {periodo}</span>
              {ultimaActualizacion && (
                <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> {ultimaActualizacion}</span>
              )}
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition shadow-lg shadow-blue-500/30 sm:shrink-0"
            >
              <Plus className="w-4 h-4" />
              {indicadores.length > 0 ? "Actualizar indicador" : "Registrar indicador"}
            </button>
          )}
        </div>

        {/* PANEL GLOBAL */}
        {loading ? (
          <div className="h-40 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ) : indicadores.length === 0 ? (
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-10 text-center">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-white/20" />
            <p className="font-semibold text-gray-600 dark:text-white/50">Sin datos registrados</p>
            <p className="text-sm text-gray-400 dark:text-white/30 mt-1">
              {canEdit ? "Usa el botón \"Registrar indicador\" para comenzar." : "Los administradores aún no han registrado indicadores."}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
            <div className="flex items-center gap-4">
              {/* Circular global score */}
              <div className="relative shrink-0">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="38" fill="none" strokeWidth="8" className="stroke-gray-100 dark:stroke-white/10" />
                  <circle
                    cx="48" cy="48" r="38" fill="none" strokeWidth="8"
                    stroke="url(#globalGrad)"
                    strokeDasharray={`${globalFilled} ${globalStroke}`}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="globalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-gray-800 dark:text-white leading-none">{resumenGlobal}%</span>
                  <span className="text-xs text-gray-400 dark:text-white/40">global</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-gray-800 dark:text-white">Índice de Sostenibilidad Global</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${semGlobal.bg} ${semGlobal.text} ${semGlobal.border}`}>
                    {semGlobal.dot} {semGlobal.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-white/40 mb-3">Promedio de los {ejes.length} ejes de sostenibilidad registrados</p>

                {/* Semáforo distribution */}
                <div className="flex items-center gap-1 mb-2">
                  {ejePorColor.verde > 0 && (
                    <div className="h-2 rounded-full bg-green-500 transition-all" style={{ flex: ejePorColor.verde }} title={`${ejePorColor.verde} óptimo`} />
                  )}
                  {ejePorColor.amarillo > 0 && (
                    <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ flex: ejePorColor.amarillo }} title={`${ejePorColor.amarillo} en progreso`} />
                  )}
                  {ejePorColor.rojo > 0 && (
                    <div className="h-2 rounded-full bg-red-400 transition-all" style={{ flex: ejePorColor.rojo }} title={`${ejePorColor.rojo} en riesgo`} />
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-white/40">
                  {ejePorColor.verde > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{ejePorColor.verde} óptimo{ejePorColor.verde > 1 ? "s" : ""}</span>}
                  {ejePorColor.amarillo > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{ejePorColor.amarillo} en progreso</span>}
                  {ejePorColor.rojo > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{ejePorColor.rojo} en riesgo</span>}
                </div>
              </div>

              {/* Quick stats */}
              <div className="hidden lg:grid grid-cols-1 gap-3 shrink-0">
                {ejes.sort((a, b) => b.pct - a.pct).slice(0, 2).map(e => (
                  <div key={e.titulo} className="flex items-center gap-2 text-xs">
                    <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${e.gradient} flex items-center justify-center`}>
                      <e.icon className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-gray-500 dark:text-white/50">{e.titulo}</span>
                    <span className={`font-bold ml-auto ${getSemaforo(e.pct).text}`}>{e.pct}%</span>
                  </div>
                ))}
                <p className="text-xs text-gray-300 dark:text-white/20 text-center">Top ejes</p>
              </div>
            </div>
          </div>
        )}

        {/* GRÁFICO DE BARRAS DIVERGENTES — solo escritorio */}
        {!loading && ejes.length > 0 && (
          <div className="hidden sm:block">
            <DivergingChart ejes={ejes} />
          </div>
        )}

        {/* TARJETAS POR EJE */}
        {!loading && ejes.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400 dark:text-white/40" />
              Detalle por eje
              <span className="text-xs font-normal text-gray-400 dark:text-white/40">· Toca ℹ para ver qué mide cada eje</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ejes.map((eje, i) => (
                <EjeCard
                  key={i}
                  {...eje}
                  expandedEje={expandedEje}
                  onToggleExpand={(t) => setExpandedEje(prev => prev === t ? null : t)}
                />
              ))}
            </div>
          </div>
        )}

        {/* LOADING SKELETON */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-44 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
          </div>
        )}

      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar indicador de Sostenibilidad">
        <IndicadorForm
          indicadores={indicadores}
          onSave={(r) => { handleSave(r); setModalOpen(false); }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

    </DashboardLayout>
  );
}

export default Indicadores;
