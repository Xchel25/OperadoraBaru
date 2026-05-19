import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  Shield, Building, CheckCircle, Bell, Moon, Sun, Globe,
  LayoutTemplate, Eye, EyeOff, Lock, Languages,
  Save, Edit3, Key, User, LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiChangePassword } from "../services/api";
import { ROLE_LABELS } from "../config/roles";

// ─── i18n ────────────────────────────────────────────────────────────────────

const I18N = {
  es: {
    title: "Configuración", subtitle: "Seguridad, preferencias y ajustes del sistema",
    profile: "Mi perfil", profileSub: "Tu información de cuenta",
    changePw: "Cambiar contraseña", currentPw: "Contraseña actual",
    newPw: "Nueva contraseña", confirmPw: "Confirmar contraseña",
    savePw: "Actualizar contraseña", cancel: "Cancelar",
    pwSuccess: "Contraseña actualizada correctamente",
    minChars: "Mínimo 8 caracteres",
    noMatch: "Las contraseñas no coinciden",
    appearance: "Apariencia", appearanceSub: "Tema de la interfaz",
    light: "Claro", dark: "Oscuro", system: "Sistema",
    language: "Idioma y región", languageSub: "Preferencias de idioma y formato",
    timezone: "Zona horaria", dateFormat: "Formato de fecha",
    notifications: "Notificaciones", notifSub: "Qué alertas quieres recibir",
    notifAvisos: "Nuevos avisos institucionales",
    notifAvisosDesc: "Cuando se publique un aviso nuevo",
    notifCursos: "Recordatorios de cursos",
    notifCursosDesc: "Cursos pendientes o próximos a vencer",
    notifReportes: "Reportes generados",
    notifReportesDesc: "Cuando alguien descarga un reporte",
    notifSistema: "Actualizaciones del sistema",
    notifSistemaDesc: "Mantenimientos y cambios importantes",
    interface: "Interfaz", interfaceSub: "Personaliza tu experiencia visual",
    topbar: "Accesos rápidos en topbar",
    topbarDesc: "Muestra u oculta los botones de acceso rápido en la barra superior",
    security: "Seguridad", securitySub: "Políticas activas de acceso",
    pwRequirements: "Requisitos de contraseña",
    sessionPolicies: "Políticas de sesión",
    req1: "Mínimo 8 caracteres",
    req2: "Letras mayúsculas y minúsculas",
    req3: "Al menos un número",
    pol1: "Bloqueo tras 3 intentos fallidos",
    pol2: "Sesión JWT de 8 horas",
    pol3: "Contraseña cifrada con bcrypt",
    company: "Datos de la empresa", companySub: "Información corporativa del sistema",
    edit: "Editar", save: "Guardar cambios",
    nombre: "Nombre", sector: "Sector",
    razonSocial: "Razón social", rfc: "RFC",
    pais: "País", estado: "Estado / Provincia",
    savedOk: "Guardado correctamente",
  },
  en: {
    title: "Settings", subtitle: "Security, preferences and system settings",
    profile: "My profile", profileSub: "Your account information",
    changePw: "Change password", currentPw: "Current password",
    newPw: "New password", confirmPw: "Confirm password",
    savePw: "Update password", cancel: "Cancel",
    pwSuccess: "Password updated successfully",
    minChars: "Minimum 8 characters",
    noMatch: "Passwords do not match",
    appearance: "Appearance", appearanceSub: "Interface theme",
    light: "Light", dark: "Dark", system: "System",
    language: "Language & region", languageSub: "Language and format preferences",
    timezone: "Timezone", dateFormat: "Date format",
    notifications: "Notifications", notifSub: "Choose which alerts you receive",
    notifAvisos: "New institutional notices",
    notifAvisosDesc: "When a new notice is published",
    notifCursos: "Course reminders",
    notifCursosDesc: "Pending or expiring courses",
    notifReportes: "Generated reports",
    notifReportesDesc: "When someone downloads a report",
    notifSistema: "System updates",
    notifSistemaDesc: "Maintenance and important changes",
    interface: "Interface", interfaceSub: "Customize your visual experience",
    topbar: "Quick access topbar",
    topbarDesc: "Show or hide quick access buttons in the top bar",
    security: "Security", securitySub: "Active access policies",
    pwRequirements: "Password requirements",
    sessionPolicies: "Session policies",
    req1: "Minimum 8 characters",
    req2: "Uppercase and lowercase letters",
    req3: "At least one number",
    pol1: "Account locked after 3 failed attempts",
    pol2: "8-hour JWT session",
    pol3: "Password encrypted with bcrypt",
    company: "Company information", companySub: "Corporate system information",
    edit: "Edit", save: "Save changes",
    nombre: "Name", sector: "Industry",
    razonSocial: "Legal name", rfc: "Tax ID",
    pais: "Country", estado: "State / Province",
    savedOk: "Saved successfully",
  },
};

// ─── Defaults empresa ─────────────────────────────────────────────────────────

const EMPRESA_DEFAULT = {
  nombre: "Grupo BARÚ",
  sector: "Industria hotelera, turismo y A&B",
  razonSocial: "BARÚ Hospitality S.A. de C.V.",
  rfc: "BAR200101AAA",
  pais: "México",
  estado: "Quintana Roo",
};

// ─── Colores por rol ──────────────────────────────────────────────────────────

const ROL_AVATAR = {
  PROJECT_MANAGER: "from-red-400 to-rose-500",
  ADMIN_AREA:      "from-blue-400 to-blue-600",
  RRHH:            "from-violet-400 to-violet-600",
  COMUNICACION:    "from-amber-400 to-amber-600",
  COLABORADOR:     "from-emerald-400 to-emerald-600",
};

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange?.(!enabled)}
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${enabled ? "bg-blue-500" : "bg-gray-200 dark:bg-white/20"}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? "right-1" : "left-1"}`} />
    </button>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({ icon: IconEl, iconBg, iconColor, title, subtitle, children }) {
  const Icon = IconEl;
  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white leading-none">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
      <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
      {msg}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

function Configuracion() {
  const { user, logout } = useAuth();
  const uid = user?.id || "guest";

  // ── idioma (contexto global) ──
  const { lang, setLang } = useLanguage();
  const t = k => I18N[lang]?.[k] ?? I18N.es[k] ?? k;

  // ── tema ──
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("theme") || "system");

  const applyTheme = mode => {
    setThemeMode(mode);
    localStorage.setItem("theme", mode);
    if (mode === "dark") document.documentElement.classList.add("dark");
    else if (mode === "light") document.documentElement.classList.remove("dark");
    else {
      const sys = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", sys);
    }
  };

  // ── notificaciones ──
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`baru_notif_${uid}`)) || { avisos: true, cursos: true, reportes: false, sistema: false }; }
    catch { return { avisos: true, cursos: true, reportes: false, sistema: false }; }
  });

  const setNotif = (key, val) => {
    const next = { ...notifs, [key]: val };
    setNotifs(next);
    localStorage.setItem(`baru_notif_${uid}`, JSON.stringify(next));
  };

  // ── topbar ──
  const [topbarEnabled, setTopbarEnabled] = useState(() => localStorage.getItem(`baru_topbar_${uid}`) !== "0");
  const toggleTopbar = () => {
    const next = !topbarEnabled;
    setTopbarEnabled(next);
    localStorage.setItem(`baru_topbar_${uid}`, next ? "1" : "0");
    window.dispatchEvent(new Event("baru-settings-changed"));
  };

  // ── cambiar contraseña ──
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm]         = useState({ current: "", new: "", confirm: "" });
  const [showCurr, setShowCurr]     = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwError, setPwError]       = useState("");
  const [pwSuccess, setPwSuccess]   = useState(false);

  const handlePwSubmit = async e => {
    e.preventDefault();
    if (pwForm.new.length < 8)            { setPwError(t("minChars")); return; }
    if (pwForm.new !== pwForm.confirm)    { setPwError(t("noMatch")); return; }
    setPwError(""); setPwLoading(true);
    try {
      await apiChangePassword(pwForm.current, pwForm.new);
      setPwSuccess(true);
      setPwForm({ current: "", new: "", confirm: "" });
      setTimeout(() => { setPwSuccess(false); setShowPwForm(false); }, 3000);
    } catch (err) {
      setPwError(err.response?.data?.error || "Error al actualizar");
    } finally { setPwLoading(false); }
  };

  // ── empresa ──
  const [empresa, setEmpresa] = useState(() => {
    try { return { ...EMPRESA_DEFAULT, ...JSON.parse(localStorage.getItem("baru_empresa")) }; }
    catch { return EMPRESA_DEFAULT; }
  });
  const [editingEmpresa, setEditingEmpresa] = useState(false);
  const [empresaForm, setEmpresaForm]       = useState(empresa);
  const [toast, setToast]                   = useState("");

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const saveEmpresa = () => {
    setEmpresa(empresaForm);
    localStorage.setItem("baru_empresa", JSON.stringify(empresaForm));
    setEditingEmpresa(false);
    showToast(t("savedOk"));
  };

  // ── idioma ──
  const changeLang = code => setLang(code);

  const initials = user?.name?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── COLUMNA IZQUIERDA (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* MI PERFIL */}
            <SectionCard icon={User} iconBg="bg-blue-50 dark:bg-blue-500/10" iconColor="text-blue-500 dark:text-blue-400"
              title={t("profile")} subtitle={t("profileSub")}>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 border border-gray-100 dark:border-white/10 mb-4">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${ROL_AVATAR[user?.role] || "from-gray-400 to-gray-600"} flex items-center justify-center text-lg font-black text-white shadow-md shrink-0`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-white">{user?.name}</p>
                  <p className="text-sm text-gray-400 dark:text-white/40 truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                    {ROLE_LABELS[user?.role] || user?.role}
                  </span>
                </div>
              </div>

              {!showPwForm ? (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setShowPwForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <Key className="w-4 h-4" /> {t("changePw")}
                  </button>
                  <button onClick={logout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-500/20 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                    <LogOut className="w-4 h-4" /> {t("logout")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePwSubmit} className="space-y-3 pt-1">
                  <p className="text-sm font-semibold text-gray-700 dark:text-white/80 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> {t("changePw")}
                  </p>
                  {pwError   && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{pwError}</p>}
                  {pwSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> {t("pwSuccess")}</p>}
                  <div className="relative">
                    <input type={showCurr ? "text" : "password"} placeholder={t("currentPw")}
                      value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => setShowCurr(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60">
                      {showCurr ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showNew ? "text" : "password"} placeholder={t("newPw")}
                      value={pwForm.new} onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))}
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <input type="password" placeholder={t("confirmPw")}
                    value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowPwForm(false); setPwError(""); setPwForm({ current: "", new: "", confirm: "" }); }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                      {t("cancel")}
                    </button>
                    <button type="submit" disabled={pwLoading}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-60">
                      {pwLoading ? "..." : t("savePw")}
                    </button>
                  </div>
                </form>
              )}
            </SectionCard>

            {/* APARIENCIA E IDIOMA */}
            <SectionCard icon={Sun} iconBg="bg-amber-50 dark:bg-amber-500/10" iconColor="text-amber-500 dark:text-amber-400"
              title={t("appearance")} subtitle={t("appearanceSub")}>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { key: "light",  label: t("light"),  Icon: Sun  },
                  { key: "dark",   label: t("dark"),   Icon: Moon },
                  { key: "system", label: t("system"), Icon: Globe },
                ].map(m => {
                  const MIcon = m.Icon;
                  const active = themeMode === m.key;
                  return (
                    <button key={m.key} onClick={() => applyTheme(m.key)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition ${
                        active
                          ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-blue-300 dark:hover:border-blue-500/40"
                      }`}>
                      <MIcon className="w-4 h-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 dark:border-white/10 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="w-4 h-4 text-gray-400 dark:text-white/40" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider">{t("language")}</p>
                </div>
                <div className="flex gap-2 mb-4">
                  {[
                    { code: "es", flag: "🇲🇽", label: "Español (MX)" },
                    { code: "en", flag: "🇺🇸", label: "English (US)" },
                  ].map(l => (
                    <button key={l.code} onClick={() => changeLang(l.code)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                        lang === l.code
                          ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-blue-300 dark:hover:border-blue-500/40"
                      }`}>
                      <span className="text-base">{l.flag}</span> {l.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t("timezone"),   val: "América/México (UTC−6)" },
                    { label: t("dateFormat"),  val: lang === "en" ? "MM/DD/YYYY" : "DD/MM/YYYY" },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                      <p className="text-[10px] text-gray-400 dark:text-white/30 uppercase tracking-wide mb-1">{f.label}</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-white/80">{f.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* NOTIFICACIONES */}
            <SectionCard icon={Bell} iconBg="bg-violet-50 dark:bg-violet-500/10" iconColor="text-violet-500 dark:text-violet-400"
              title={t("notifications")} subtitle={t("notifSub")}>
              <div className="space-y-1">
                {[
                  { key: "avisos",   label: t("notifAvisos"),   desc: t("notifAvisosDesc") },
                  { key: "cursos",   label: t("notifCursos"),   desc: t("notifCursosDesc") },
                  { key: "reportes", label: t("notifReportes"), desc: t("notifReportesDesc") },
                  { key: "sistema",  label: t("notifSistema"),  desc: t("notifSistemaDesc") },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-white/80">{n.label}</p>
                      <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{n.desc}</p>
                    </div>
                    <Toggle enabled={notifs[n.key]} onChange={v => setNotif(n.key, v)} />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* INTERFAZ */}
            <SectionCard icon={LayoutTemplate} iconBg="bg-teal-50 dark:bg-teal-500/10" iconColor="text-teal-500 dark:text-teal-400"
              title={t("interface")} subtitle={t("interfaceSub")}>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-white/80">{t("topbar")}</p>
                  <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{t("topbarDesc")}</p>
                </div>
                <Toggle enabled={topbarEnabled} onChange={toggleTopbar} />
              </div>
            </SectionCard>

          </div>

          {/* ── COLUMNA DERECHA (1/3) ── */}
          <div className="space-y-6">

            {/* SEGURIDAD */}
            <SectionCard icon={Shield} iconBg="bg-red-50 dark:bg-red-500/10" iconColor="text-red-500 dark:text-red-400"
              title={t("security")} subtitle={t("securitySub")}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2">{t("pwRequirements")}</p>
                  <div className="space-y-2">
                    {[t("req1"), t("req2"), t("req3")].map((r, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-white/60">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-white/10 pt-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2">{t("sessionPolicies")}</p>
                  <div className="space-y-2">
                    {[t("pol1"), t("pol2"), t("pol3")].map((p, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-white/60">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* DATOS EMPRESA */}
            <SectionCard icon={Building} iconBg="bg-indigo-50 dark:bg-indigo-500/10" iconColor="text-indigo-500 dark:text-indigo-400"
              title={t("company")} subtitle={t("companySub")}>

              {/* Logo / nombre */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 border border-gray-100 dark:border-white/10 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shrink-0">
                  <Building className="w-6 h-6 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-white text-sm">{empresa.nombre}</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 truncate">{empresa.sector}</p>
                </div>
              </div>

              {editingEmpresa ? (
                <div className="space-y-2">
                  {[
                    { key: "nombre",      label: t("nombre") },
                    { key: "sector",      label: t("sector") },
                    { key: "razonSocial", label: t("razonSocial") },
                    { key: "rfc",         label: t("rfc") },
                    { key: "pais",        label: t("pais") },
                    { key: "estado",      label: t("estado") },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] text-gray-400 dark:text-white/30 uppercase tracking-wide block mb-0.5">{f.label}</label>
                      <input value={empresaForm[f.key]}
                        onChange={e => setEmpresaForm(v => ({ ...v, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setEmpresaForm(empresa); setEditingEmpresa(false); }}
                      className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                      {t("cancel")}
                    </button>
                    <button onClick={saveEmpresa}
                      className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition flex items-center justify-center gap-1.5">
                      <Save className="w-3.5 h-3.5" /> {t("save")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-3">
                    {[
                      { label: t("razonSocial"), val: empresa.razonSocial },
                      { label: t("rfc"),         val: empresa.rfc },
                      { label: t("pais"),        val: empresa.pais },
                      { label: t("estado"),      val: empresa.estado },
                    ].map((f, i) => (
                      <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 dark:border-white/5 last:border-0">
                        <span className="text-xs text-gray-400 dark:text-white/30">{f.label}</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-white/80">{f.val}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setEmpresaForm(empresa); setEditingEmpresa(true); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <Edit3 className="w-3.5 h-3.5" /> {t("edit")}
                  </button>
                </>
              )}
            </SectionCard>

          </div>
        </div>
      </div>

      {toast && <Toast msg={toast} />}
    </DashboardLayout>
  );
}

export default Configuracion;
